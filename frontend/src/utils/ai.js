function stripJsonFence(text) {
  if (!text) return text
  return String(text)
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()
}

function getObjectFieldText(obj, keys) {
  if (!obj || typeof obj !== 'object') return null
  for (const key of keys) {
    const value = obj?.[key]
    const extracted = extractText(value)
    if (extracted) return extracted
  }
  return null
}

function extractText(value) {
  if (value == null) return null
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    const text = String(value).trim()
    return text || null
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const extracted = extractText(item)
      if (extracted) return extracted
    }
    return null
  }
  if (typeof value === 'object') {
    return getObjectFieldText(value, ['name', 'label', 'value', 'department', 'departmentName'])
  }
  return null
}

function extractDepartmentFromParsedObject(parsed) {
  if (!parsed || typeof parsed !== 'object') return null

  const direct = getObjectFieldText(parsed, ['department', 'departmentSuggestion', 'suggestedDepartment'])
  if (direct) return direct

  const nestedData = getObjectFieldText(parsed?.data, ['department', 'departmentSuggestion', 'suggestedDepartment'])
  if (nestedData) return nestedData

  const nestedClassification = getObjectFieldText(parsed?.classification, ['department', 'departmentSuggestion', 'suggestedDepartment'])
  if (nestedClassification) return nestedClassification

  return null
}

export function extractAiSuggestedDepartmentName(aiRawResponseJson) {
  if (!aiRawResponseJson || typeof aiRawResponseJson !== 'string') return null

  try {
    const root = JSON.parse(aiRawResponseJson)
    const parsedModelJsonDept = extractDepartmentFromParsedObject(root)
    if (parsedModelJsonDept) return parsedModelJsonDept

    const parts = root?.candidates?.[0]?.content?.parts
    if (!Array.isArray(parts)) return null

    const textPayload = parts
      .map((part) => (typeof part?.text === 'string' ? part.text : ''))
      .join('\n')
      .trim()

    if (!textPayload) return null

    const sanitized = stripJsonFence(textPayload)
    const modelJson = JSON.parse(sanitized)
    return extractDepartmentFromParsedObject(modelJson)
  } catch {
    return null
  }
}
