# NUPS Batch 17 Browser Acceptance

Use an authenticated owner/manager session and DEMO or SANDBOX data only. Prefix every synthetic record with `BATCH17-`.

## Preconditions

- Batch 17 noninteractive aggregate is green.
- Correct test venue selected.
- Mode is DEMO or SANDBOX.
- Current browser is an approved active trusted `VenueTerminal` for the selected venue.
- Synthetic staff, guest, entertainer and evidence data are prepared.
- No live payment credential or REAL GlyphBucks path is selected.

## Journey

Record route, actor, venue, mode, record ID, refresh result and relevant audit event at every stage.

1. Owner/admin login.
2. Select test venue.
3. Select DEMO or SANDBOX.
4. Verify terminal recognition and mode display.
5. Clock in synthetic staff through NKS2.
6. Scan synthetic ID data.
7. Confirm `GuestProfile` created or matched.
8. Confirm linked `VIPGuest.guest_profile_id`.
9. Exercise entertainer credential verification with synthetic media.
10. Edit Daily Checklist, save, refresh and verify item order/required flags.
11. Save entertainer playlist, refresh and verify track order.
12. Load playlist into DJ workspace.
13. Create a safe non-live register transaction.
14. Confirm transaction venue and mode.
15. Start the non-live VIP workflow.
16. Capture synthetic protected evidence through the private path.
17. Confirm opaque `protected:<id>` references and absence of private `file_uri` in UI/network payloads.
18. Complete a non-live contract where safe.
19. Open and close a VIP room/session.
20. Close the non-live POS batch.
21. Generate the non-live Z-report.
22. Verify `total_sales = cash_sales + card_sales`.
23. Verify GlyphBucks is excluded from sales revenue.
24. Verify audit events and refresh persistence.
25. Search every `BATCH17-` record and confirm none is in REAL or the wrong venue.

## Prohibited test actions

- live card charge;
- REAL GlyphBucks issuance;
- real identity document or biometric;
- real customer signature or contract;
- real employee PIN in screenshots/logs;
- direct entity deletion for cleanup.

## Completion

The browser journey is PASS only when every required stage has direct UI/runtime evidence. Component compilation, static checks or direct database creation do not substitute for the click-through.
