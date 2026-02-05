export async function sendReceiptToCloudPrinter(orderId: string) {
  await new Promise((resolve) => setTimeout(resolve, 500))
  console.info('[receipt-print] sent', { orderId })
  return { ok: true }
}
