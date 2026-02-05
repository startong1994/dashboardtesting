export async function sendMenuAvailability(itemId: string, available: boolean) {
  await new Promise((resolve) => setTimeout(resolve, 420))
  console.info('[menu-86] update', { itemId, available })
  return { ok: true }
}
