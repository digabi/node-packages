function renameProperty(obj: Record<string, unknown>, prop: string, newName: string) {
  if (prop !== newName) {
    obj[newName] = obj[prop]
    delete obj[prop]
  }
}

function capitalizeFirstLetter(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

function stringToCamel(str: string) {
  const words = str.split('_')
  return words.map((word, i) => (i > 0 ? capitalizeFirstLetter(word) : word)).join('')
}

export function objectPropertiesToCamel(obj: Record<string, unknown>) {
  for (const prop in obj) {
    // eslint-disable-next-line no-prototype-builtins
    if (!obj.hasOwnProperty(prop)) {
      continue
    }
    renameProperty(obj, prop, stringToCamel(prop))
  }

  return obj
}
