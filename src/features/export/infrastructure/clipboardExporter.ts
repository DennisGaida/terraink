export async function copyCanvasToClipboard(
  canvas: HTMLCanvasElement,
): Promise<void> {
  if (!navigator.clipboard?.write) {
    throw new Error(
      "Clipboard API is not supported in this browser. Try Chrome, Edge, or Safari.",
    );
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Failed to create image from canvas."))),
      "image/png",
    );
  });

  await navigator.clipboard.write([
    new ClipboardItem({ "image/png": blob }),
  ]);
}
