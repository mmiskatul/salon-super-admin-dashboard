/** Console link for an insight "place" key: a shop id, or `barber:<userId>` for an independent barber. */
export function placeHref(key: string): string {
  return key.startsWith('barber:') ? `/barbers/${key.slice('barber:'.length)}` : `/shops/${key}`;
}
