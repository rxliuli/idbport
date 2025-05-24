import { useState } from 'react'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Exporter } from './components/Exporter'
import { Importer } from './components/Importer'
import { Button } from '@/components/ui/button'
import { XIcon } from 'lucide-react'
import { useOpen } from '@/integrations/dialog/open'
import { cn } from '@/lib/utils'

export function IndexPage() {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export')

  const { open, toggle } = useOpen()

  function onClickMask(ev: React.MouseEvent<HTMLDivElement>) {
    if (ev.target === ev.currentTarget) {
      toggle()
    }
  }
  return (
    <div
      className={cn(
        'fixed inset-0 bg-black/50 flex items-start justify-center pt-[calc(50vh-150px)]',
        open ? 'fixed' : 'hidden',
      )}
      onClick={onClickMask}
    >
      <Card className="w-[500px] max-h-[80vh] overflow-hidden flex flex-col">
        <CardHeader>
          <div>
            <CardTitle>IndexedDB Data Management</CardTitle>
            <CardDescription>
              Export or import your IndexedDB data
            </CardDescription>
          </div>
          <CardAction>
            <Button variant={'ghost'} size={'icon'} onClick={toggle}>
              <XIcon className="w-4 h-4" />
            </Button>
          </CardAction>
        </CardHeader>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'export' | 'import')}
          className="flex-1 overflow-hidden flex flex-col"
        >
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="export">Export Data</TabsTrigger>
              <TabsTrigger value="import">Import Data</TabsTrigger>
            </TabsList>
          </div>

          <CardContent className="flex-1 overflow-auto pt-6">
            <TabsContent value="export">
              <Exporter />
            </TabsContent>

            <TabsContent value="import" className="mt-0">
              <Importer />
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  )
}
