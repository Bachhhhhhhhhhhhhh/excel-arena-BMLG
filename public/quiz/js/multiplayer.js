/**
 * Multiplayer realtime (cùng lúc) qua PeerJS — không cần backend.
 * Host tạo phòng → mã 6 ký tự. Mọi người join, mỗi người chơi board riêng,
 * bảng điểm sync realtime.
 */
const Multiplayer = (() => {
  const PREFIX = "efgq";
  /** @type {import('peerjs').Peer | null} */
  let peer = null;
  /** @type {Map<string, any>} peerId -> DataConnection (host only for guests; guest has 1 to host) */
  const conns = new Map();
  let role = null; // 'host' | 'guest' | null
  let roomCode = null;
  let selfId = null;
  /** @type {Record<string, Player>} */
  let players = {};
  let onRoster = () => {};
  let onStatus = () => {};
  let onError = () => {};

  /**
   * @typedef {Object} Player
   * @property {string} id
   * @property {string} name
   * @property {number} score
   * @property {number} correct
   * @property {number} answered
   * @property {boolean} online
   * @property {boolean} [isHost]
   * @property {number} [updatedAt]
   */

  function randomCode(len = 6) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let s = "";
    for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }

  function hostPeerId(code) {
    return PREFIX + String(code).toUpperCase().replace(/[^A-Z0-9]/g, "");
  }

  function getSelf() {
    return players[selfId] || null;
  }

  function listPlayers() {
    return Object.values(players)
      .filter((p) => p.online)
      .sort((a, b) => b.score - a.score || b.correct - a.correct || a.name.localeCompare(b.name));
  }

  function setSelfStats({ name, score, correct, answered }) {
    if (!selfId || !players[selfId]) return;
    if (name != null) players[selfId].name = name;
    if (score != null) players[selfId].score = score;
    if (correct != null) players[selfId].correct = correct;
    if (answered != null) players[selfId].answered = answered;
    players[selfId].updatedAt = Date.now();
    broadcastUpdate();
    onRoster(listPlayers(), { role, roomCode, selfId });
  }

  function broadcastUpdate() {
    const me = players[selfId];
    if (!me) return;
    const msg = { type: "update", player: me };

    if (role === "host") {
      // update self in roster and push full roster
      broadcastRoster();
    } else if (role === "guest") {
      // send to host only
      conns.forEach((c) => {
        if (c.open) c.send(msg);
      });
    }
  }

  function broadcastRoster() {
    const msg = {
      type: "roster",
      players: Object.values(players),
      roomCode,
    };
    conns.forEach((c) => {
      if (c.open) c.send(msg);
    });
    onRoster(listPlayers(), { role, roomCode, selfId });
  }

  function handleMessage(data, fromPeerId) {
    if (!data || !data.type) return;

    if (data.type === "join" && role === "host") {
      const p = data.player;
      if (!p || !p.id) return;
      players[p.id] = { ...p, online: true, updatedAt: Date.now() };
      broadcastRoster();
      return;
    }

    if (data.type === "update" && role === "host") {
      const p = data.player;
      if (!p || !p.id) return;
      players[p.id] = {
        ...(players[p.id] || {}),
        ...p,
        online: true,
        updatedAt: Date.now(),
      };
      broadcastRoster();
      return;
    }

    if (data.type === "roster" && role === "guest") {
      players = {};
      (data.players || []).forEach((p) => {
        players[p.id] = p;
      });
      onRoster(listPlayers(), { role, roomCode, selfId });
      return;
    }

    if (data.type === "ping") {
      // ignore
    }
  }

  function wireConn(conn) {
    conn.on("data", (data) => handleMessage(data, conn.peer));
    conn.on("close", () => {
      conns.delete(conn.peer);
      if (role === "host") {
        // mark offline by peer mapping: guest peer id stored as player peerKey
        Object.keys(players).forEach((id) => {
          if (players[id].peerKey === conn.peer) {
            players[id].online = false;
          }
        });
        broadcastRoster();
      } else if (role === "guest") {
        onStatus("Mất kết nối host. Thử join lại.");
        onError("disconnected");
      }
    });
    conn.on("error", (err) => {
      console.warn("conn error", err);
    });
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
    role = null;
    roomCode = null;
    selfId = null;
    players = {};
  }

  /**
   * Host tạo phòng
   */
  function createRoom(playerName) {
    return new Promise((resolve, reject) => {
      destroyPeer();
      if (typeof Peer === "undefined") {
        reject(new Error("PeerJS chưa load. Kiểm tra mạng/CDN."));
        return;
      }

      const code = randomCode(6);
      const hid = hostPeerId(code);
      onStatus("Đang tạo phòng…");

      peer = new Peer(hid, {
        debug: 0,
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:global.stun.twilio.com:3478" },
          ],
        },
      });

      peer.on("open", (id) => {
        role = "host";
        roomCode = code;
        selfId = "host-" + id;
        players[selfId] = {
          id: selfId,
          peerKey: id,
          name: playerName || "Host",
          score: 0,
          correct: 0,
          answered: 0,
          online: true,
          isHost: true,
          updatedAt: Date.now(),
        };
        onStatus("Phòng sẵn sàng · mã " + code);
        onRoster(listPlayers(), { role, roomCode, selfId });
        resolve({ roomCode: code, role: "host" });
      });

      peer.on("connection", (conn) => {
        conns.set(conn.peer, conn);
        conn.on("open", () => {
          wireConn(conn);
          // send current roster immediately
          conn.send({
            type: "roster",
            players: Object.values(players),
            roomCode,
          });
        });
        wireConn(conn);
      });

      peer.on("error", (err) => {
        console.error(err);
        const msg = err?.type === "unavailable-id"
          ? "Mã phòng trùng, thử tạo lại."
          : err?.message || String(err);
        onError(msg);
        onStatus("Lỗi: " + msg);
        reject(err);
      });
    });
  }

  /**
   * Guest join phòng
   */
  function joinRoom(code, playerName) {
    return new Promise((resolve, reject) => {
      destroyPeer();
      if (typeof Peer === "undefined") {
        reject(new Error("PeerJS chưa load."));
        return;
      }

      const clean = String(code || "")
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "");
      if (clean.length < 4) {
        reject(new Error("Mã phòng không hợp lệ"));
        return;
      }

      const hid = hostPeerId(clean);
      onStatus("Đang vào phòng " + clean + "…");

      peer = new Peer({
        debug: 0,
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:global.stun.twilio.com:3478" },
          ],
        },
      });

      peer.on("open", (myId) => {
        role = "guest";
        roomCode = clean;
        selfId = "g-" + myId;
        players[selfId] = {
          id: selfId,
          peerKey: myId,
          name: playerName || "Guest",
          score: 0,
          correct: 0,
          answered: 0,
          online: true,
          isHost: false,
          updatedAt: Date.now(),
        };

        const conn = peer.connect(hid, { reliable: true });
        conns.set(hid, conn);

        const timeout = setTimeout(() => {
          reject(new Error("Không kết nối được host (sai mã / host offline)."));
        }, 12000);

        conn.on("open", () => {
          clearTimeout(timeout);
          wireConn(conn);
          conn.send({ type: "join", player: players[selfId] });
          onStatus("Đã vào phòng " + clean + " — chơi cùng lúc!");
          onRoster(listPlayers(), { role, roomCode, selfId });
          resolve({ roomCode: clean, role: "guest" });
        });

        conn.on("error", (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });

      peer.on("error", (err) => {
        onError(err?.message || String(err));
        reject(err);
      });
    });
  }

  function leave() {
    if (role === "guest") {
      conns.forEach((c) => {
        try {
          c.send({ type: "leave", id: selfId });
        } catch {
          /* */
        }
      });
    }
    destroyPeer();
    onStatus("Đã rời phòng");
    onRoster([], { role: null, roomCode: null, selfId: null });
  }

  function isInRoom() {
    return !!role && !!roomCode;
  }

  function getRoomInfo() {
    return { role, roomCode, selfId, players: listPlayers() };
  }

  function on(event, fn) {
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
