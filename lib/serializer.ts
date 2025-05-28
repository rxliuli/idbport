import {
  stringifyAsync as stringifyD,
  parse as parseD,
  BlobPlugin,
  FilePlugin,
} from 'devaluex'

export async function stringifyAsync(value: any): Promise<string> {
  return stringifyD(value, {
    plugins: [BlobPlugin, FilePlugin],
  })
}

export function parse(str: string): any {
  return parseD(str, {
    plugins: [BlobPlugin, FilePlugin],
  })
}
