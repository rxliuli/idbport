import * as devalue from 'devalue'

// https://github.com/flightcontrolhq/superjson/issues/233#issuecomment-2481675752
export async function blob2json(blob: Blob): Promise<[string, ArrayBuffer]> {
  const buffer = await blob.arrayBuffer()
  return [blob.type, buffer]
}

export function json2blob([type, data]: [string, Uint8Array]): Blob {
  return new Blob([data], { type })
}

export async function stringifyAsync(value: any): Promise<string> {
  const refs: Record<string, Promise<ArrayBuffer>> = {}

  let result = devalue.stringify(value, {
    Blob: (value) => {
      if (!(value instanceof Blob)) {
        return false
      }
      const id = '__' + Date.now() + '__' + Math.random() + '__'
      refs[id] = value.arrayBuffer()
      return [value.type, id]
    },
  })

  await Promise.all(
    Object.entries(refs).map(async ([k, bf]) => {
      const s = devalue.stringify(await bf)
      result = result.replace(`"${k}"`, s.slice(1, s.length - 1))
    }),
  )

  return result
}

export function parse(str: string): any {
  return devalue.parse(str, {
    Blob: ([type, bf]: [string, ArrayBuffer]) => new Blob([bf], { type }),
  })
}
