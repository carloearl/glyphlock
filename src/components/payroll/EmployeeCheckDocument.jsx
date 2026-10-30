import React from 'react';
import {
  BANK_NAME,
  CHECK_STOCK_LABEL,
  EMPLOYER,
  amountInWords,
  fmtCents,
  fmtDate,
  periodLabel,
  stampFor,
} from '@/lib/payroll/checkFormat';

const INK = '#0d1a3a';
const LINE = '#334466';

function StampOverlay({ stamp }) {
  if (stamp.negotiable) return null;
  return (
    <div
      style={{
        position: 'absolute', top: '46%', left: '50%',
        transform: 'translate(-50%,-50%) rotate(-24deg)',
        fontSize: 52, fontWeight: 900, letterSpacing: 6, color: '#8a1010',
        opacity: 0.14, whiteSpace: 'nowrap', pointerEvents: 'none',
        fontFamily: 'Arial Black, Arial, sans-serif', zIndex: 4,
      }}
    >
      {stamp.stamp}
    </div>
  );
}

function CheckFace({ record, stamp }) {
  return (
    <div style={{ position: 'relative', background: '#dce8f5', overflow: 'hidden', fontFamily: 'Arial, Helvetica, sans-serif' }}>
      <div style={{ position: 'absolute', inset: 7, border: '0.7px solid #7090b0', pointerEvents: 'none', zIndex: 2 }} />
      <StampOverlay stamp={stamp} />

      <div style={{ background: INK, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 3 }}>
        <div style={{ fontSize: 6.5, color: '#8ab0d0', letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase' }}>
          UNSIGNED · NOT VALID WITHOUT AUTHORIZED SIGNATURE · GLYPHLOCK LLC EMPLOYEE PAYROLL · AZ ENTITY #{EMPLOYER.entityNumber}
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 3, padding: '10px 18px 6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 11, color: INK }}>{EMPLOYER.name}</div>
            <div style={{ fontSize: 8.5, color: '#334', lineHeight: 1.6 }}>{EMPLOYER.phone}</div>
            <div style={{ fontSize: 8.5, color: '#334', lineHeight: 1.6 }}>{EMPLOYER.addr1}</div>
            <div style={{ fontSize: 8.5, color: '#334' }}>{EMPLOYER.addr2}</div>
          </div>

          <div style={{ flex: 1, textAlign: 'center', background: '#fff', border: '1px solid #b0b8cc', padding: '5px 10px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: INK, letterSpacing: '0.02em' }}>{BANK_NAME}</div>
            <div style={{ fontSize: 6.8, color: '#445', marginTop: 2 }}>{CHECK_STOCK_LABEL}</div>
            <div style={{ fontSize: 6.2, color: '#667', marginTop: 2 }}>Routing / account numbers not stored</div>
          </div>

          <div style={{ flex: '0 0 auto', textAlign: 'right' }}>
            <div style={{ fontSize: 7, color: '#556', fontWeight: 700 }}>AZ Entity #: {EMPLOYER.entityNumber}</div>
            <div style={{ border: '1.5px solid ' + LINE, background: '#fff', padding: '3px 10px', marginTop: 6, minWidth: 88 }}>
              <div style={{ fontSize: 6.5, color: '#556', fontWeight: 700, letterSpacing: '0.08em' }}>CHECK NO.</div>
              <div style={{ fontFamily: "'Courier New', monospace", fontWeight: 700, fontSize: 17, color: INK, letterSpacing: 2 }}>
                {record.check_number}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4, marginBottom: 3 }}>
          <div style={{ background: INK, color: '#fff', padding: '2px 14px', fontSize: 7.5, fontWeight: 700 }}>DATE</div>
          <div style={{ background: INK, color: '#fff', padding: '2px 14px', fontSize: 7.5, fontWeight: 700 }}>AMOUNT</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 8 }}>
          <div style={{ fontSize: 8.5, color: '#556', fontWeight: 700 }}>PAY</div>
          <div style={{ flex: 1, borderBottom: `1.5px solid ${LINE}`, padding: '0 6px 2px', fontFamily: "'Courier New', monospace", fontSize: 11, color: '#111', fontWeight: 700 }}>
            {amountInWords(record.net_cents)}
          </div>
          <div style={{ borderBottom: `1.5px solid ${LINE}`, minWidth: 92, padding: '0 6px 2px', fontFamily: "'Courier New', monospace", fontSize: 11, textAlign: 'center' }}>
            {fmtDate(record.issue_date)}
          </div>
          <div style={{ border: `2px solid ${LINE}`, background: '#fffef8', padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ fontSize: 10, color: '#556', fontWeight: 700 }}>$</span>
            <span style={{ fontFamily: "'Courier New', monospace", fontWeight: 900, fontSize: 15, color: '#111', minWidth: 86, textAlign: 'right' }}>
              {fmtCents(record.net_cents).replace('$', '')}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flexShrink: 0 }}>
            <span style={{ fontSize: 8, color: '#556' }}>TO THE</span>
            <span style={{ fontSize: 8, color: '#556' }}>ORDER</span>
            <span style={{ fontSize: 8, color: '#556' }}>OF</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ borderBottom: `1.5px solid ${LINE}`, padding: '0 6px 2px', fontFamily: "'Courier New', monospace", fontWeight: 700, fontSize: 14, color: INK }}>
              {record.employee_name}
            </div>
          </div>
          <div style={{ flex: 1.1 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
              <span style={{ fontSize: 8, color: '#556', marginBottom: 2 }}>FOR</span>
              <div style={{ flex: 1, borderBottom: `1.5px solid ${LINE}`, padding: '0 6px 2px', fontFamily: "'Courier New', monospace", fontSize: 9.5, color: '#111' }}>
                {record.memo ? `${record.memo} · ` : ''}Payroll {periodLabel(record)}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontSize: 7.5, color: '#778', marginBottom: 2 }}>Financial Institution</div>
            <div style={{ fontWeight: 700, fontSize: 10.5, color: INK }}>{BANK_NAME}</div>
            <div style={{ fontSize: 6.8, color: '#667' }}>preprinted stock only</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ borderBottom: '2px solid #222', height: 24, marginBottom: 3 }} />
            <div style={{ fontSize: 8, color: '#778', fontStyle: 'italic' }}>AUTHORIZED SIGNATURE REQUIRED</div>
          </div>
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 3, padding: '10px 18px 8px' }}>
        <div style={{ fontFamily: "'Courier New', monospace", fontSize: 9.5, letterSpacing: 1, color: '#0d0d40' }}>
          PREPRINTED CHASE STOCK — ROUTING AND ACCOUNT NUMBERS ARE NOT STORED OR PRINTED BY THIS APPLICATION
        </div>
      </div>
    </div>
  );
}

function PayStub({ record, stamp }) {
  const deductions = record.deductions || [];
  const ytdAvailable = record.ytd_status === 'VERIFIED_OPENING';
  const ytd = (value) => (ytdAvailable ? fmtCents(value) : 'Unavailable');

  return (
    <div style={{ background: '#fff', fontFamily: 'Arial, Helvetica, sans-serif', fontSize: 9, borderTop: `1.5px solid ${LINE}` }}>
      <div style={{ background: '#f4f4f8', borderBottom: '1.5px solid #9090b0', padding: '5px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 11, color: INK }}>{EMPLOYER.name}</div>
        <div style={{ display: 'flex' }}>
          {[
            { l: 'EMPLOYEE', v: record.employee_name },
            { l: 'PAY TYPE', v: record.pay_type || 'SALARY' },
            { l: 'PERIOD END', v: fmtDate(record.period_end) },
            { l: 'ISSUE DATE', v: fmtDate(record.issue_date) },
            { l: 'CHECK NO.', v: record.check_number },
          ].map((field) => (
            <div key={field.l} style={{ padding: '2px 10px', borderLeft: '1px solid #9090b0', textAlign: 'center' }}>
              <div style={{ fontSize: 6.5, fontWeight: 700, color: '#666', letterSpacing: '0.07em' }}>{field.l}</div>
              <div style={{ fontSize: 8.5, fontWeight: 700, color: INK, fontFamily: "'Courier New', monospace" }}>{field.v}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1.5px solid #9090b0' }}>
        <div style={{ borderRight: '1.5px solid #9090b0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', background: '#dde0f0', borderBottom: '1px solid #9090b0' }}>
            {['EARNINGS', 'AMOUNT', 'OPENING YTD'].map((h) => (
              <div key={h} style={{ padding: '3px 8px', fontWeight: 700, fontSize: 7.5, color: INK, borderRight: '1px solid #9090b0', textAlign: h === 'EARNINGS' ? 'left' : 'right' }}>{h}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', borderBottom: '1px solid #e0e0ec' }}>
            <div style={{ padding: '3px 8px', fontSize: 8.5, color: '#222' }}>
              {record.pay_type === 'HOURLY' ? 'Hourly wages + reported tips' : 'Salary'} · {periodLabel(record)}
            </div>
            <div style={{ padding: '3px 8px', fontSize: 8.5, textAlign: 'right', fontFamily: "'Courier New', monospace" }}>{fmtCents(record.gross_cents)}</div>
            <div style={{ padding: '3px 8px', fontSize: 8.5, textAlign: 'right', fontFamily: "'Courier New', monospace", color: '#555' }}>{ytd(record.ytd_gross_cents)}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', borderTop: '1.5px solid #334466', background: '#eeeef8' }}>
            <div style={{ padding: '4px 8px', fontWeight: 700, fontSize: 8.5, color: INK }}>GROSS WAGES</div>
            <div style={{ padding: '4px 8px', fontWeight: 700, fontSize: 8.5, textAlign: 'right', fontFamily: "'Courier New', monospace" }}>{fmtCents(record.gross_cents)}</div>
            <div style={{ padding: '4px 8px', fontWeight: 700, fontSize: 8.5, textAlign: 'right', fontFamily: "'Courier New', monospace", color: '#555' }}>{ytd(record.ytd_gross_cents)}</div>
          </div>
          {record.hourly_earnings && <div style={{ padding: '5px 8px', fontSize: 8, color: '#334' }}>
            Regular wages {fmtCents(record.hourly_earnings.regular_cents)} · Overtime {fmtCents(record.hourly_earnings.overtime_cents)} · Reported tips {fmtCents(record.hourly_earnings.reported_tips_cents)}<br />
            Regular hours {record.hourly_earnings.regular_hours_hundredths / 100} · Overtime hours {record.hourly_earnings.overtime_hours_hundredths / 100} · Rate {fmtCents(record.hourly_earnings.hourly_rate_cents)}/hr<br />
            Tips already paid (not a tax deduction): {fmtCents(record.tips_paid_cents || 0)}
          </div>}
          <div style={{ background: '#e4e6ff', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', borderTop: '1px solid #9090b0' }}>
            <div style={{ padding: '4px 8px', fontWeight: 700, fontSize: 8.5, color: '#006600' }}>NET CHECK</div>
            <div style={{ padding: '4px 8px', fontWeight: 700, fontSize: 8.5, textAlign: 'right', fontFamily: "'Courier New', monospace", color: '#006600' }}>{fmtCents(record.net_cents)}</div>
            <div style={{ padding: '4px 8px', fontWeight: 700, fontSize: 8.5, textAlign: 'right', fontFamily: "'Courier New', monospace", color: '#555' }}>{ytd(record.ytd_net_cents)}</div>
          </div>
        </div>

        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', background: '#dde0f0', borderBottom: '1px solid #9090b0' }}>
            {['DEDUCTION (OPERATOR VERIFIED)', 'AMOUNT', 'OPENING YTD'].map((h) => (
              <div key={h} style={{ padding: '3px 8px', fontWeight: 700, fontSize: 7.5, color: INK, borderRight: '1px solid #9090b0', textAlign: h === 'DEDUCTION (OPERATOR VERIFIED)' ? 'left' : 'right' }}>{h}</div>
            ))}
          </div>
          {deductions.length === 0 && (
            <div style={{ padding: '4px 8px', fontSize: 8, color: '#664', borderBottom: '1px solid #e0e0ec' }}>
              No withholding recorded — operator confirmed.
            </div>
          )}
          {deductions.map((item, index) => (
            <div key={`${item.code || item.label}-${index}`} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', borderBottom: '1px solid #e0e0ec', background: index % 2 === 0 ? '#fafafa' : '#fff' }}>
              <div style={{ padding: '3px 8px', fontSize: 8.5, color: '#222' }}>{item.label}</div>
              <div style={{ padding: '3px 8px', fontSize: 8.5, textAlign: 'right', fontFamily: "'Courier New', monospace", color: '#880000' }}>({fmtCents(item.amount_cents)})</div>
              <div style={{ padding: '3px 8px', fontSize: 8.5, textAlign: 'right', fontFamily: "'Courier New', monospace", color: '#555' }}>{ytdAvailable ? '—' : 'Unavailable'}</div>
            </div>
          ))}
          <div style={{ borderTop: '1.5px solid #334466', background: '#fff0f0', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr' }}>
            <div style={{ padding: '4px 8px', fontWeight: 700, fontSize: 8.5, color: '#880000' }}>TOTAL DEDUCTIONS</div>
            <div style={{ padding: '4px 8px', fontWeight: 700, fontSize: 8.5, textAlign: 'right', fontFamily: "'Courier New', monospace", color: '#880000' }}>({fmtCents(record.total_deductions_cents)})</div>
            <div style={{ padding: '4px 8px', fontWeight: 700, fontSize: 8.5, textAlign: 'right', fontFamily: "'Courier New', monospace", color: '#555' }}>{ytd(record.ytd_deductions_cents)}</div>
          </div>
          <div style={{ background: '#eeeef8', padding: '4px 8px', borderTop: '1px solid #9090b0', lineHeight: 1.5 }}>
            <div style={{ fontSize: 7.5, color: '#556' }}>
              Withholding uses the saved employee elections and server calculation when automatic taxes are selected; other deductions are operator verified. Net check excludes reported tips already paid.
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '4px 16px', display: 'flex', justifyContent: 'space-between', background: '#f4f4f8', borderTop: '1px solid #ccc', gap: 10 }}>
        <div style={{ fontSize: 7, color: '#888' }}>
          {stamp.label} · Opening YTD is before this check · {EMPLOYER.name}
        </div>
        <div style={{ fontSize: 7, color: '#888' }}>
          CHECK #{record.check_number} · ISSUE DATE {fmtDate(record.issue_date)} · PERIOD {periodLabel(record)}
        </div>
      </div>
    </div>
  );
}

export default function EmployeeCheckDocument({ record, printId }) {
  const stamp = stampFor(record, { reprinted: true });

  return (
    <div id={printId} style={{ width: 816, background: '#fff', border: '1.5px solid #7090b0', boxShadow: '0 6px 32px rgba(0,0,0,0.2)' }}>
      <CheckFace record={record} stamp={stamp} />
      <div style={{ height: 18, background: '#f2f2f8', borderTop: '1px solid #ccd', borderBottom: '1px solid #ccd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 7.5, color: '#a0a0b0', letterSpacing: '0.12em', fontStyle: 'italic' }}>
          DETACH AND RETAIN THE PAY STUB BELOW FOR YOUR RECORDS
        </span>
      </div>
      <PayStub record={record} stamp={stamp} />
    </div>
  );
}