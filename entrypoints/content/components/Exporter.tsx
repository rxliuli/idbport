import { SelectGroup } from '@/components/extra/SelectGroup'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { exportIDB } from '@/lib/exporter'
import { useMutation, useQuery } from '@tanstack/react-query'
import { CircleStopIcon, DownloadIcon } from 'lucide-react'
import { saveAs } from '@rxliuli/file-saver'
import { useUnmount } from 'react-use'
import { toast } from 'sonner'
import { ExpectedError } from '@/lib/error'
import { Progress } from '@/components/ui/progress'

export function Exporter() {
  const [name, setName] = useState<string | undefined>('')
  const [progress, setProgress] = useState(0)
  const databases = useQuery({
    queryKey: ['databases'],
    queryFn: async () => {
      if (import.meta.env.FIREFOX) {
        return []
      }
      const list = await indexedDB.databases()
      return list
    },
    enabled: !import.meta.env.FIREFOX,
  })

  const controller = useRef<AbortController>(new AbortController())
  function stopExport() {
    controller.current.abort()
  }
  useUnmount(stopExport)
  const mutation = useMutation({
    mutationFn: async () => {
      if (!name) {
        return
      }
      if (mutation.isPending) {
        return
      }
      controller.current.abort()
      controller.current = new AbortController()
      const start = Date.now()
      setProgress(0)
      let total = 0
      const blob = await exportIDB(name, {
        onProgress: (data) => {
          setProgress((data.progress.current / data.progress.total) * 100)
          total = data.progress.total
        },
        signal: controller.current.signal,
      })
      saveAs(blob, `Export-${name}-${new Date().toISOString()}.idb`)
      setProgress(0)
      const end = Date.now()
      console.log(
        `Exported database ${name} in ${end - start}ms, total ${total}`,
      )
    },
    onSuccess: () => {
      toast.success('Exported database successfully')
    },
    onError: (error) => {
      setProgress(0)
      if (error instanceof ExpectedError) {
        if (error.code === 'aborted') {
          toast.info('Export aborted')
          return
        }
        toast.error('Export failed', {
          description: error.message,
        })
      } else {
        toast.error('Export failed')
      }
      console.error(error)
    },
  })

  return (
    <div>
      <div className="mb-4">
        <label className="text-sm font-medium mb-2 block">
          Select Database
        </label>
        {import.meta.env.FIREFOX ? (
          <div className={'flex gap-2'}>
            <Input
              placeholder="Enter database name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={'flex-1'}
            />
          </div>
        ) : (
          <SelectGroup
            value={name}
            onChange={setName}
            options={
              databases.data?.map((it) => ({
                label: it.name!,
                value: it.name!,
              })) ?? []
            }
            placeholder="Select database to export"
            className="w-full"
          />
        )}
        {import.meta.env.FIREFOX && (
          <p className="text-xs text-muted-foreground mt-2">
            Firefox browser requires manual database name input
          </p>
        )}
      </div>
      {name && mutation.isPending && (
        <div className="text-sm text-muted-foreground mb-4 space-y-2">
          <div>
            Exporting database <span className="font-medium">{name}</span>
          </div>
          <Progress value={progress} className="w-full" />
          <div className="text-xs">{Math.round(progress)}%</div>
        </div>
      )}
      <div className="flex gap-2 justify-end">
        {mutation.isPending ? (
          <Button onClick={stopExport} variant="destructive" className="gap-1">
            <CircleStopIcon />
            Stop Export
          </Button>
        ) : (
          <Button
            onClick={() => mutation.mutate()}
            disabled={!name}
            className="gap-1"
          >
            <DownloadIcon className="h-4 w-4" />
            Export
          </Button>
        )}
      </div>
    </div>
  )
}
