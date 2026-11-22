// Freelance jobs. A job with status "pago" is money that entered the cash, so
// monthSummary (finance.js) counts it as income in the month of its date.
// "pendente" jobs only show up as "a receber" — they don't count until paid.

export const FREELANCE_STATUS = {
  pago: { label: "Recebido", tone: "green" },
  pendente: { label: "A receber", tone: "amber" },
};

// "2026-11-21" → "2026-11" (same format as the month keys in format.js)
export const freelanceMonth = (f) => f.date.slice(0, 7);

export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// Turns paid jobs of a month into income entries, same shape as data.incomes.
export function freelanceIncomes(freelances = [], month) {
  return freelances
    .filter((f) => f.status === "pago" && freelanceMonth(f) === month)
    .map((f) => ({
      id: f.id,
      month,
      description: `Freela · ${f.client.name || f.title}`,
      amount: f.amount,
      freelance: true, // lets the UI show it differently and send edits to the Freelas page
    }));
}

// Screenshots are stored as data URLs (text) in localStorage/Supabase, which have small
// limits (~5 MB in localStorage). So we shrink them first: max 1280px wide, JPEG 70%.
// A typical full-screen print goes from ~1 MB (PNG) to ~100–200 KB.
export function compressImage(file, maxSize = 1280, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff"; // transparent PNG areas would turn black in JPEG
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(img.src);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => reject(new Error("Imagem inválida"));
    img.src = URL.createObjectURL(file);
  });
}
