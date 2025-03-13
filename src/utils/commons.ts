export const stringEnumToArray = (stringEnum: { [key: string]: string }) => {
  return Object.values(stringEnum).filter((value) => typeof value === 'string') as string[]
}
