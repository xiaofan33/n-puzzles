export function validateIds(
  ids: readonly (number | null)[][],
): { isValid: true } | { isValid: false; message: string } {
  if (ids.length === 0) {
    return { isValid: false, message: 'IDs array must not be empty' }
  }

  const cols = ids[0]?.length ?? 0
  if (cols === 0) {
    return { isValid: false, message: 'Row cannot be empty' }
  }

  for (let r = 0; r < ids.length; r++) {
    if (ids[r].length !== cols) {
      return {
        isValid: false,
        message: `Inconsistent row length: row 0 has ${cols}, but row ${r} has ${ids[r].length}`,
      }
    }
  }

  // 死格（null）不参与编号，有效 id 应为 0..total-1 的一个排列
  const total = ids.reduce(
    (sum, row) => sum + row.filter(id => id !== null).length,
    0,
  )
  const seen = new Array<boolean>(total)

  for (const row of ids) {
    for (const id of row) {
      if (id === null) continue

      if (!Number.isInteger(id) || id < 0 || id >= total) {
        return {
          isValid: false,
          message: `Invalid ID: ${id}. Expected integers in [0, ${total - 1}]`,
        }
      }
      if (seen[id]) {
        return { isValid: false, message: `Duplicate ID: ${id}` }
      }
      seen[id] = true
    }
  }

  return { isValid: true }
}
