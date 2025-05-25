import * as devalue from 'devalue'

// https://github.com/flightcontrolhq/superjson/issues/233#issuecomment-2481675752
function blob2string(blob: Blob): string {
  const url = URL.createObjectURL(blob)
  const xhr = new XMLHttpRequest()
  xhr.open('GET', url, false)
  xhr.send()
  return xhr.response
}

export async function stringifyAsync(value: any): Promise<string> {
  return devalue.stringify(value, {
    Blob: (value) => value instanceof Blob && [value.type, blob2string(value)],
  })
}

export function parse(str: string): any {
  return devalue.parse(str, {
    Blob: ([type, value]) => new Blob([value], { type }),
  })
}

// import { serializeAsync, deserialize } from 'seroval'
// import { BlobPlugin } from 'seroval-plugins/web'

// export async function stringifyAsync(value: any): Promise<string> {
//   return serializeAsync(value, {
//     plugins: [BlobPlugin],
//   })
// }

// export function parse(str: string): any {
//   return deserialize(str)
// }
