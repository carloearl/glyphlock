Deno.serve(async () => {
  return Response.json(
    {
      success: false,
      error: "transcribeAudio is not currently configured.",
      code: "TRANSCRIBE_AUDIO_NOT_CONFIGURED",
    },
    { status: 501 },
  );
});
