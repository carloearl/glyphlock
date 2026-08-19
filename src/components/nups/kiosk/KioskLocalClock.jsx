import React, { useEffect, useState } from "react";

const TZ = "America/Phoenix";

const timeFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
});
const dateFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

/** Live venue-local (Arizona / MST, no DST) clock for the kiosk header. */
export default function KioskLocalClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="text-center">
      <div className="text-3xl font-black tabular-nums tracking-wide text-white">
        {timeFmt.format(now)}
      </div>
      <div className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        {dateFmt.format(now)} · Arizona (MST)
      </div>
    </div>
  );
}