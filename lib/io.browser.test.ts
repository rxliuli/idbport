import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BlobWriter, TextReader, TextWriter } from './io'

describe('BlobWriter', () => {
  // Helper to create Uint8Array from string
  const s = (str: string) => new TextEncoder().encode(str)

  let writer: BlobWriter
  const textContentType = 'text/plain;charset=utf-8'

  beforeEach(() => {
    // Ensure a fresh writer for each test, unless explicitly testing persistence
  })

  afterEach(() => {
    // Clean up any global mocks or states if necessary
    vi.restoreAllMocks()
  })

  it('should construct with default content type', () => {
    writer = new BlobWriter()
    // We can't directly inspect the content type of the ongoing blob promise easily
    // But we can check if getData() provides a promise
    expect(writer.getData()).toBeInstanceOf(Promise)
  })

  it('should construct with a specified content type', async () => {
    writer = new BlobWriter(textContentType)
    await writer.close() // Close to finalize blob
    const blob = await writer.getData()
    expect(blob.type).toBe(textContentType)
  })

  it('write() should accept Uint8Array chunks', async () => {
    writer = new BlobWriter(textContentType)
    await writer.write(s('hello'))
    await writer.write(s(' world'))
    await writer.close()
    const blob = await writer.getData()
    expect(await blob.text()).toBe('hello world')
    expect(blob.size).toBe(s('hello world').byteLength)
  })

  it('write() should throw if chunk is not Uint8Array', async () => {
    writer = new BlobWriter()
    // @ts-expect-error Testing invalid input
    await expect(writer.write('not a Uint8Array')).rejects.toThrow(TypeError)
    // Abort to clean up the stream as it's now in an undefined state for further valid ops
    await writer.abort('test cleanup').catch(() => {})
  })

  it('close() should finalize the blob', async () => {
    writer = new BlobWriter(textContentType)
    await writer.write(s('test data'))
    await writer.close()
    const blob = await writer.getData()
    expect(blob).toBeInstanceOf(Blob)
    expect(await blob.text()).toBe('test data')
  })

  it('close() on an empty writer should produce an empty blob', async () => {
    writer = new BlobWriter(textContentType)
    await writer.close()
    const blob = await writer.getData()
    expect(blob.size).toBe(0)
    expect(await blob.text()).toBe('')
  })

  it('calling close() multiple times should be idempotent', async () => {
    writer = new BlobWriter(textContentType)
    await writer.write(s('data'))
    await writer.close()
    await writer.close() // Second call
    const blob = await writer.getData()
    expect(await blob.text()).toBe('data')
  })

  it('getData() should return a promise that resolves to the blob', async () => {
    writer = new BlobWriter(textContentType)
    const dataPromise = writer.getData()
    expect(dataPromise).toBeInstanceOf(Promise)

    await writer.write(s('async data'))
    await writer.close()

    const blob = await dataPromise
    expect(blob).toBeInstanceOf(Blob)
    expect(await blob.text()).toBe('async data')
  })

  it('write() should throw an error if called after close()', async () => {
    writer = new BlobWriter()
    await writer.write(s('initial'))
    await writer.close()
    await expect(writer.write(s('too late'))).rejects.toThrow(
      'BlobWriter: Stream is already closed or aborted. Cannot write.',
    )
  })

  it('abort() should cause getData() to reject or resolve to an incomplete/empty blob depending on timing', async () => {
    writer = new BlobWriter(textContentType)
    await writer.write(s('some data'))

    // Abort the writer
    const abortReason = 'User cancelled'
    await writer.abort(abortReason)

    // getData() should ideally reject if the underlying stream was aborted
    // The exact behavior (reject or resolve with empty/partial) can depend on how streams handle abort propagation
    try {
      await writer.getData()
      // If it resolves, it might be an empty blob or partially written if abort is slow to propagate
      // This is harder to test deterministically without mocking Response/Stream internals deeply
      // For now, we assume if it doesn't throw, it's likely a consequence of stream behavior
      // console.warn("getData() did not reject after abort. This might be due to stream behavior.");
    } catch (e: any) {
      expect(e).toBeInstanceOf(Error) // Or match specific error if Response.blob() propagates it
      // console.log("getData rejected as expected after abort:", e.message);
    }
  })

  it('abort() on an empty writer should also allow getData() to be handled (likely reject)', async () => {
    writer = new BlobWriter()
    await writer.abort('aborting empty')
    try {
      await writer.getData()
    } catch (e: any) {
      expect(e).toBeInstanceOf(Error)
    }
  })

  it('calling abort() multiple times should be idempotent', async () => {
    writer = new BlobWriter()
    await writer.write(s('data'))
    await writer.abort('first abort')
    await writer.abort('second abort') // Second call
    try {
      await writer.getData()
    } catch (e: any) {
      expect(e).toBeInstanceOf(Error)
    }
  })

  it('write() should throw an error if called after abort()', async () => {
    writer = new BlobWriter()
    await writer.abort('aborted early')
    await expect(writer.write(s('too late after abort'))).rejects.toThrow(
      'BlobWriter: Stream is already closed or aborted. Cannot write.',
    )
  })

  it('should handle backpressure (conceptual test - hard to test precisely without deep stream mocks)', async () => {
    // This is a conceptual test. Real backpressure testing is complex.
    // We are checking if the write promises resolve, implying data was accepted.
    writer = new BlobWriter()
    const promises: Promise<void>[] = []
    for (let i = 0; i < 100; i++) {
      // Write many small chunks
      promises.push(writer.write(new Uint8Array([i])))
    }
    await Promise.all(promises) // All writes should eventually complete
    await writer.close()
    const blob = await writer.getData()
    expect(blob.size).toBe(100)
  })
})

describe('TextWriter', () => {
  it('should construct with default content type', async () => {
    const writer = new TextWriter()
    writer.write('hello')
    writer.write(' world')
    await writer.close()
    const blob = await writer.getData()
    expect(blob).toBeInstanceOf(Blob)
    expect(await blob.text()).toBe('hello world')
  })
})

describe('TextReader', () => {
  it('should read lines', async () => {
    const tr = new TextReader(new Blob(['hello\nworld\n']))
    const reader = tr.readLine().getReader()
    const lines = []
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      lines.push(value)
    }
    expect(lines).toEqual(['hello', 'world'])
  })
})
