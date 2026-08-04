/**
 * Multiplayer realtime — hybrid:
 * 1) BroadcastChannel + localStorage (cùng máy / nhiều tab) — luôn ổn
 * 2) PeerJS P2P (máy khác / mạng khác) — best effort
 */
const Multiplayer = (() => {
  const PREFIX = "efgq";
  const LS_ROOM = "efg_mp_rooms_v1";

  let peer = null;
  const conns = new Map();
  let role = null;
  let roomCode = null;
  let selfId = null;
  let players = {};
  let bc = null;
  let pollIv = null;
  let onRoster = () => {};
  let onStatus = () => {};
  let onError = () => {};

  function randomCode(len = 6) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let s = "";
    for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }

  function hostPeerId(code) {
    return PREFIX + String(code).toUpperCase().replace(/[^A-Z0-9]/g, "");
  }

  function listPlayers() {
    const now = Date.now();
    return Object.values(players)
      .filter((p) => p && p.online && now - (p.updatedAt || 0) < 45000)
      .sort(
        (a, b) =>
          b.score - a.score ||
          b.correct - a.correct ||
          String(a.name).localeCompare(String(b.name))
      );
  }

  function emitRoster() {
    onRoster(listPlayers(), { role, roomCode, selfId });
  }

  function readRoomStore(code) {
    try {
      const all = JSON.parse(localStorage.getItem(LS_ROOM) || "{}");
      return all[code] || { players: {}, updatedAt: 0 };
    } catch {
      return { players: {}, updatedAt: 0 };
    }
  }

  function writeRoomStore(code, data) {
    try {
      const all = JSON.parse(localStorage.getItem(LS_ROOM) || "{}");
      // dọn phòng cũ > 2h
      const now = Date.now();
      Object.keys(all).forEach((k) => {
        if (now - (all[k].updatedAt || 0) > 2 * 3600 * 1000) delete all[k];
      });
      all[code] = { ...data, updatedAt: now };
      localStorage.setItem(LS_ROOM, JSON.stringify(all));
    } catch (e) {
      console.warn("room store write fail", e);
    }
  }

  function mergePlayers(incoming) {
    if (!Array.isArray(incoming) && typeof incoming === "object") {
      incoming = Object.values(incoming);
    }
    (incoming || []).forEach((p) => {
      if (!p || !p.id) return;
      const prev = players[p.id];
      if (!prev || (p.updatedAt || 0) >= (prev.updatedAt || 0)) {
        players[p.id] = { ...prev, ...p, online: p.online !== false };
      }
    });
  }

  function publishLocal() {
    if (!roomCode || !selfId) return;
    const me = players[selfId];
    if (!me) return;

    // localStorage bus
    const store = readRoomStore(roomCode);
    store.players = store.players || {};
    store.players[selfId] = { ...me, updatedAt: Date.now() };
    // drop stale
    const now = Date.now();
    Object.keys(store.players).forEach((id) => {
      if (now - (store.players[id].updatedAt || 0) > 45000) {
        delete store.players[id];
      }
    });
    writeRoomStore(roomCode, store);
    mergePlayers(Object.values(store.players));

    // BroadcastChannel
    try {
      if (bc) {
        bc.postMessage({
          type: "roster",
          roomCode,
          players: Object.values(players),
        });
      }
    } catch {
      /* */
    }

    // PeerJS
    peerBroadcast();
    emitRoster();
  }

  function peerBroadcast() {
    const msg = {
      type: "roster",
      roomCode,
      players: Object.values(players),
    };
    conns.forEach((c) => {
      try {
        if (c.open) c.send(msg);
      } catch {
        /* */
      }
    });
  }

  function handleRemoteRoster(data) {
    if (!data || data.roomCode !== roomCode) return;
    mergePlayers(data.players);
    // ensure self not wiped
    if (selfId && players[selfId]) {
      players[selfId].online = true;
    }
    emitRoster();
  }

  function openBroadcast(code) {
    closeBroadcast();
    try {
      if (typeof BroadcastChannel !== "undefined") {
        bc = new BroadcastChannel("efg_room_" + code);
        bc.onmessage = (ev) => {
          const data = ev.data;
          if (!data) return;
          if (data.type === "roster") handleRemoteRoster(data);
          if (data.type === "ping" && data.player) {
            mergePlayers([data.player]);
            emitRoster();
          }
        };
      }
    } catch {
      bc = null;
    }

    // poll localStorage every 1.2s (cross-tab + same-browser profiles share storage)
    clearInterval(pollIv);
    pollIv = setInterval(() => {
      if (!roomCode) return;
      const store = readRoomStore(roomCode);
      mergePlayers(Object.values(store.players || {}));
      // re-publish self lightly
      if (selfId && players[selfId]) {
        players[selfId].updatedAt = Date.now();
        store.players = store.players || {};
        store.players[selfId] = players[selfId];
        writeRoomStore(roomCode, store);
      }
      emitRoster();
    }, 1200);
  }

  function closeBroadcast() {
    try {
      if (bc) bc.close();
    } catch {
      /* */
    }
    bc = null;
    clearInterval(pollIv);
    pollIv = null;
  }

  function wireConn(conn) {
    if (conn.__efgWired) return;
    conn.__efgWired = true;

    conn.on("data", (data) => {
      if (!data || !data.type) return;
      if (data.type === "join" || data.type === "update") {
        if (data.player) {
          mergePlayers([
            {
              ...data.player,
              peerKey: conn.peer,
              online: true,
              updatedAt: Date.now(),
            },
          ]);
          if (role === "host") publishLocal();
          else emitRoster();
        }
      }
      if (data.type === "roster") handleRemoteRoster(data);
      if (data.type === "leave" && data.id) {
        if (players[data.id]) players[data.id].online = false;
        if (role === "host") publishLocal();
        else emitRoster();
      }
    });

    conn.on("close", () => {
      conns.delete(conn.peer);
      Object.keys(players).forEach((id) => {
        if (players[id].peerKey === conn.peer) players[id].online = false;
      });
      if (role === "host") publishLocal();
      if (role === "guest") {
        onStatus("Mất kết nối P2P — vẫn sync qua tab/local nếu cùng máy.");
      }
      emitRoster();
    });

    conn.on("error", (err) => console.warn("peer conn", err));
  }

  function destroyPeer() {
    try {
      conns.forEach((c) => c.close());
    } catch {
      /* */
    }
    conns.clear();
    try {
      if (peer) peer.destroy();
    } catch {
      /* */
    }
    peer = null;
  }

  function fullReset() {
    destroyPeer();
    closeBroadcast();
    role = null;
    roomCode = null;
    selfId = null;
    players = {};
  }

  function makeSelf(name, isHost, peerKey) {
    selfId =
      (isHost ? "h_" : "g_") +
      Math.random().toString(36).slice(2, 10) +
      Date.now().toString(36).slice(-4);
    players[selfId] = {
      id: selfId,
      peerKey: peerKey || selfId,
      name: name || (isHost ? "Host" : "Player"),
      score: 0,
      correct: 0,
      answered: 0,
      online: true,
      isHost: !!isHost,
      updatedAt: Date.now(),
    };
  }

  function startLocalRoom(code, name, isHost) {
    roomCode = code;
    role = isHost ? "host" : "guest";
    makeSelf(name, isHost);
    openBroadcast(code);
    publishLocal();
    onStatus(
      isHost
        ? "Phòng " + code + " sẵn sàng (local + P2P)"
        : "Đã vào phòng " + code + " — chơi cùng lúc!"
    );
    emitRoster();
  }

  function tryPeerHost(code, name) {
    return new Promise((resolve) => {
      if (typeof Peer === "undefined") {
        resolve(false);
        return;
      }
      let settled = false;
      const hid = hostPeerId(code);
      try {
        peer = new Peer(hid, {
          debug: 0,
          config: {
            iceServers: [
              { urls: "stun:stun.l.google.com:19302" },
              { urls: "stun:stun1.l.google.com:19302" },
            ],
          },
        });
      } catch {
        resolve(false);
        return;
      }

      const t = setTimeout(() => {
        if (!settled) {
          settled = true;
          resolve(false);
        }
      }, 8000);

      peer.on("open", (id) => {
        if (players[selfId]) players[selfId].peerKey = id;
        peer.on("connection", (conn) => {
          conns.set(conn.peer, conn);
          conn.on("open", () => {
            wireConn(conn);
            try {
              conn.send({
                type: "roster",
                roomCode,
                players: Object.values(players),
              });
            } catch {
              /* */
            }
          });
          wireConn(conn);
        });
        if (!settled) {
          settled = true;
          clearTimeout(t);
          resolve(true);
        }
      });

      peer.on("error", (err) => {
        console.warn("peer host error", err);
        if (!settled) {
          settled = true;
          clearTimeout(t);
          try {
            peer.destroy();
          } catch {
            /* */
          }
          peer = null;
          resolve(false);
        }
      });
    });
  }

  function tryPeerJoin(code) {
    return new Promise((resolve) => {
      if (typeof Peer === "undefined") {
        resolve(false);
        return;
      }
      let settled = false;
      const hid = hostPeerId(code);
      try {
        peer = new Peer({
          debug: 0,
          config: {
            iceServers: [
              { urls: "stun:stun.l.google.com:19302" },
              { urls: "stun:stun1.l.google.com:19302" },
            ],
          },
        });
      } catch {
        resolve(false);
        return;
      }

      const t = setTimeout(() => {
        if (!settled) {
          settled = true;
          resolve(false);
        }
      }, 10000);

      peer.on("open", (myId) => {
        if (players[selfId]) players[selfId].peerKey = myId;
        const conn = peer.connect(hid, { reliable: true });
        conns.set(hid, conn);
        conn.on("open", () => {
          wireConn(conn);
          try {
            conn.send({ type: "join", player: players[selfId] });
          } catch {
            /* */
          }
          if (!settled) {
            settled = true;
            clearTimeout(t);
            resolve(true);
          }
        });
        conn.on("error", () => {
          if (!settled) {
            settled = true;
            clearTimeout(t);
            resolve(false);
          }
        });
        wireConn(conn);
      });

      peer.on("error", () => {
        if (!settled) {
          settled = true;
          clearTimeout(t);
          resolve(false);
        }
      });
    });
  }

  async function createRoom(playerName) {
    fullReset();
    const code = randomCode(6);
    onStatus("Đang tạo phòng " + code + "…");
    startLocalRoom(code, playerName, true);
    // P2P thêm (không chặn nếu fail)
    const ok = await tryPeerHost(code, playerName);
    onStatus(
      ok
        ? "Phòng " + code + " · P2P + local OK — mời bạn bè!"
        : "Phòng " + code + " · local OK (P2P hạn chế mạng)"
    );
    return { roomCode: code, role: "host" };
  }

  async function joinRoom(code, playerName) {
    const clean = String(code || "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
    if (clean.length < 4) throw new Error("Mã phòng không hợp lệ (ít nhất 4 ký tự)");

    fullReset();
    onStatus("Đang vào phòng " + clean + "…");
    startLocalRoom(clean, playerName, false);

    // nếu local đã có host players → ok
    const store = readRoomStore(clean);
    const count = Object.keys(store.players || {}).length;
    const p2p = await tryPeerJoin(clean);

    if (count <= 1 && !p2p) {
      onStatus(
        "Đã join local. Nếu host ở máy khác mà không thấy nhau, kiểm tra host còn mở tab và cùng mã."
      );
    } else {
      onStatus("Đã vào phòng " + clean + " — chơi cùng lúc!");
    }
    publishLocal();
    return { roomCode: clean, role: "guest" };
  }

  function setSelfStats({ name, score, correct, answered }) {
    if (!selfId) return;
    if (!players[selfId]) return;
    if (name != null) players[selfId].name = String(name).slice(0, 24);
    if (score != null) players[selfId].score = Number(score) || 0;
    if (correct != null) players[selfId].correct = Number(correct) || 0;
    if (answered != null) players[selfId].answered = Number(answered) || 0;
    players[selfId].updatedAt = Date.now();
    players[selfId].online = true;
    publishLocal();
  }

  function leave() {
    if (roomCode && selfId) {
      try {
        conns.forEach((c) => {
          if (c.open) c.send({ type: "leave", id: selfId });
        });
      } catch {
        /* */
      }
      const store = readRoomStore(roomCode);
      if (store.players) delete store.players[selfId];
      writeRoomStore(roomCode, store);
    }
    fullReset();
    onStatus("Đã rời phòng");
    emitRoster();
  }

  function isInRoom() {
    return !!(role && roomCode && selfId);
  }

  function getRoomInfo() {
    return { role, roomCode, selfId, players: listPlayers() };
  }

  function on(event, fn) {
    if (typeof fn !== "function") return;
    if (event === "roster") onRoster = fn;
    if (event === "status") onStatus = fn;
    if (event === "error") onError = fn;
  }

  return {
    createRoom,
    joinRoom,
    leave,
    setSelfStats,
    isInRoom,
    getRoomInfo,
    listPlayers,
    on,
  };
})();
