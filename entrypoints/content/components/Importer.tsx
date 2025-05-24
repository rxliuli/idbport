import { Button } from '@/components/ui/button'
import { ExpectedError } from '@/lib/error'
import { importIDB } from '@/lib/exporter'
import { fileSelector } from '@/lib/fileSelector'
import { useMutation } from '@tanstack/react-query'
import { CircleStopIcon, UploadIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useUnmount } from 'react-use'
import { Progress } from '@/components/ui/progress'

export function Importer() {
  const [name, setName] = useState<string>('')
  const [progress, setProgress] = useState(0)
  const [, setSelectedFile] = useState<File>()
  const controller = useRef<AbortController>(new AbortController())
  function stopImport() {
    controller.current.abort()
  }
  useUnmount(stopImport)
  const mutation = useMutation({
    mutationFn: async () => {
      controller.current.abort()
      controller.current = new AbortController()

      const files = await fileSelector({
        accept: '.idb',
        multiple: false,
      })
      const file = files?.[0]
      if (!file) {
        return
      }
      setSelectedFile(file)
      await importIDB(file, {
        signal: controller.current.signal,
        onProgress: (data) => {
          if (name !== data.meta.name) {
            setName(data.meta.name)
          }
          setProgress((data.progress.current / data.progress.total) * 100)
        },
      })
      toast.success('Import Success')
    },
    onError: (err) => {
      if (err instanceof ExpectedError) {
        if (err.code === 'aborted') {
          toast.info('Import aborted')
          return
        }
        toast.error('Import Error', {
          description: err.message,
        })
      } else {
        toast.error('Import Error', {
          description: 'Unknown error',
        })
      }
      console.error(err)
    },
    onSettled: () => {
      setProgress(0)
      setName('')
    },
  })

  return (
    <div className="mb-4">
      <label className="text-sm font-medium mb-4 block">
        Select Import File
      </label>
      {name && mutation.isPending && (
        <div className="text-sm text-muted-foreground space-y-2 mb-4">
          <div>
            Importing database <span className="font-medium">{name}</span>
          </div>
          <Progress value={progress} className="w-full" />
          <div className="text-xs">{Math.round(progress)}%</div>
        </div>
      )}
      <div className="flex gap-2 justify-end">
        {mutation.isPending ? (
          <Button onClick={stopImport} variant="destructive" className="gap-1">
            <CircleStopIcon />
            Stop Import
          </Button>
        ) : (
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="gap-1"
          >
            <UploadIcon className="h-4 w-4" />
            Import
          </Button>
        )}
      </div>
    </div>
  )
}
