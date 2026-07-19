import type { SampleTable as SampleTableType } from "@/types";

export function SampleTable({ data }: { data: SampleTableType }) {
  const colCount = Math.max(
    data.headers?.length ?? 0,
    ...data.rows.map((r) => r.length),
    1
  );

  const colLabels = Array.from({ length: colCount }, (_, i) =>
    String.fromCharCode(65 + i)
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-[#A8D8FF]/70 bg-white/80 shadow-ice backdrop-blur-sm">
      <div className="flex items-center gap-2 border-b border-[#A8D8FF]/40 bg-gradient-to-r from-[#E8F4FF] to-[#F0F9FF] px-3 py-2">
        <span className="flex gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-[#A8D8FF]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#7EC8FF]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#7DD3FC]" />
        </span>
        <span className="text-xs font-semibold text-[#1E3A5F]/80">
          Bảng dữ liệu mẫu
          {data.rangeLabel ? ` · ${data.rangeLabel}` : ""}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[240px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="w-9 bg-[#E8F4FF]/50 px-2 py-1.5 text-[10px] font-bold text-[#7EC8FF]" />
              {colLabels.map((c) => (
                <th
                  key={c}
                  className="bg-[#E8F4FF]/50 px-3 py-1.5 text-center text-xs font-bold text-[#5BB8FF]"
                >
                  {c}
                </th>
              ))}
            </tr>
            {data.headers && (
              <tr>
                <td className="bg-[#F0F9FF] px-2 py-1.5 text-center text-[10px] font-bold text-[#A8D8FF]">
                  1
                </td>
                {data.headers.map((h, i) => (
                  <td
                    key={i}
                    className="border border-[#E8F4FF] bg-gradient-to-b from-[#E8F4FF] to-white px-3 py-2 font-semibold text-[#1E3A5F]"
                  >
                    {h}
                  </td>
                ))}
              </tr>
            )}
          </thead>
          <tbody>
            {data.rows.map((row, ri) => {
              const rowNum = (data.headers ? 2 : 1) + ri;
              return (
                <tr
                  key={ri}
                  className="transition-colors hover:bg-[#E8F4FF]/40"
                >
                  <td className="bg-[#F0F9FF]/80 px-2 py-1.5 text-center text-[10px] font-bold text-[#A8D8FF]">
                    {rowNum}
                  </td>
                  {Array.from({ length: colCount }).map((_, ci) => {
                    const v = row[ci];
                    return (
                      <td
                        key={ci}
                        className="border border-[#E8F4FF]/80 px-3 py-1.5 font-mono text-[#1E3A5F]"
                      >
                        {v === null || v === undefined || v === "" ? (
                          <span className="rounded bg-[#E8F4FF] px-1.5 text-[#A8D8FF]">
                            ∅
                          </span>
                        ) : (
                          String(v)
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
