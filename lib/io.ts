export class BlobWriter {
  private readonly _writable: WritableStream<Uint8Array>
  private readonly _blobPromise: Promise<Blob>
  private _writer: WritableStreamDefaultWriter<Uint8Array> | null = null
  private _isClosedOrAborted: boolean = false // True if close() or abort() has been *completed* or an error occurred

  constructor(contentType: string = 'application/octet-stream') {
    const transformStream = new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        controller.enqueue(chunk)
      },
    })

    this._writable = transformStream.writable

    const headers: HeadersInit = {}
    if (contentType) {
      headers['Content-Type'] = contentType
    }

    this._blobPromise = new Response(transformStream.readable, {
      headers,
    }).blob()
    this._blobPromise.catch((error) => {
      // If blobPromise rejects (e.g. readable stream errors), mark as aborted
      this._isClosedOrAborted = true
      console.error('BlobWriter: Error during Blob creation (async):', error)
    })
  }

  private _getOrInitWriter(): WritableStreamDefaultWriter<Uint8Array> {
    // This function is only called when an operation (write, close, abort) needs the writer.
    // The _isClosedOrAborted flag is checked by the public methods before calling this.
    if (!this._writer) {
      this._writer = this._writable.getWriter()
    }
    return this._writer
  }

  async write(chunk: Uint8Array): Promise<void> {
    if (this._isClosedOrAborted) {
      throw new Error(
        'BlobWriter: Stream is already closed or aborted. Cannot write.',
      )
    }
    if (!(chunk instanceof Uint8Array)) {
      throw new TypeError('BlobWriter: chunk must be a Uint8Array.')
    }

    const writer = this._getOrInitWriter()
    try {
      await writer.ready
      await writer.write(chunk)
    } catch (error) {
      this._isClosedOrAborted = true // Mark as unusable on write error
      console.error('BlobWriter: Error writing chunk:', error)
      // Attempt to abort the underlying writer if possible, to signal the readable side
      if (this._writer && !this._writable.locked) {
        // Check if we can still abort
        // Don't await here as we are already in a catch block and want to rethrow original error
        this._writer
          .abort(error)
          .catch((e) =>
            console.warn(
              'BlobWriter: Error aborting writer after write error:',
              e,
            ),
          )
      }
      throw error
    }
  }

  async close(): Promise<void> {
    if (this._isClosedOrAborted) {
      // If already closed or aborted, and close is called again, it's a no-op.
      // However, if _blobPromise ultimately resolved, this is fine. If it rejected, it's already handled.
      // console.warn("BlobWriter: Stream already closed or aborted when close() was called.");
      return
    }

    // Mark intent to close, primarily to prevent new writes if close() is in progress
    // but _isClosedOrAborted will be finally set true in the finally block or catch.
    // For simplicity, let's directly proceed to get writer.

    const writer = this._getOrInitWriter() // Get writer; it might not exist if no writes were made.

    try {
      await writer.ready
      await writer.close()
      this._isClosedOrAborted = true // Successfully closed
      // console.log("BlobWriter: WritableStream closed successfully.");
    } catch (error) {
      this._isClosedOrAborted = true // Mark as unusable on close error
      console.error('BlobWriter: Error closing writer:', error)
      throw error
    } finally {
      // Even if an error occurs, or successful, if writer was obtained, we are done with it for this instance.
      // Releasing lock is good practice if the stream were to be used by another writer,
      // but for BlobWriter, once closed/aborted, it's done.
      // if (this._writer) {
      //   // this._writer.releaseLock(); // No longer needed for this pattern
      //   this._writer = null;
      // }
    }
  }

  async abort(reason?: any): Promise<void> {
    if (this._isClosedOrAborted) {
      // console.warn("BlobWriter: Stream already closed or aborted when abort() was called.");
      return
    }

    const writer = this._getOrInitWriter()
    try {
      await writer.abort(reason)
      this._isClosedOrAborted = true // Successfully aborted
      // console.log("BlobWriter: WritableStream aborted successfully.", reason);
    } catch (error) {
      this._isClosedOrAborted = true // Mark as unusable on abort error
      console.error('BlobWriter: Error aborting writer:', error)
      throw error
    } finally {
      // if (this._writer) {
      //   // this._writer.releaseLock();
      //   this._writer = null;
      // }
    }
  }

  getData(): Promise<Blob> {
    return this._blobPromise
  }
}

export class TextWriter {
  close: () => Promise<void>
  abort: (reason?: any) => Promise<void>
  write: (chunk: string) => Promise<void>
  writeLine: (chunk: string) => Promise<void>
  getData: () => Promise<Blob>
  constructor() {
    const writer = new BlobWriter('text/plain')
    this.close = writer.close.bind(writer)
    this.abort = writer.abort.bind(writer)
    this.getData = writer.getData.bind(writer)
    this.write = (chunk: string) =>
      writer.write(new TextEncoder().encode(chunk))
    this.writeLine = (chunk: string) =>
      writer.write(new TextEncoder().encode(chunk + '\n'))
  }
}

class LineBreakStream extends TransformStream<string, string> {
  constructor() {
    let temp = ''
    super({
      transform(chunk, controller) {
        temp += chunk
        const lines = temp.split('\n')
        for (let i = 0; i < lines.length - 1; i++) {
          const it = lines[i]
          controller.enqueue(it)
          temp = temp.slice(it.length + 1)
        }
      },
      flush(controller) {
        if (temp.length !== 0) {
          controller.enqueue(temp)
        }
      },
    })
  }
}

export class TextReader {
  constructor(private readonly data: Blob) {}

  readLine() {
    return this.data
      .stream()
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new LineBreakStream())
  }
}
