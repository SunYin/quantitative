import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Disclaimer, MarketBadge } from "@/components/research";
import { api } from "@/lib/api";

export default async function StrategiesPage() {
  const [meta, strategies] = await Promise.all([api.meta.get(), api.strategy.list()]);
  const first = strategies[0]?.id ?? "quality_value";

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">研究策略</h1>
      <Disclaimer text={meta.disclaimer} asOf={meta.as_of} live={meta.live} />
      <p className="text-sm text-muted-foreground">
        输出是研究优先级，不是下单指令。A/H 价差反映投资者结构，不是无风险套利。
      </p>
      <Tabs defaultValue={first}>
        <TabsList>
          {strategies.map((strategy) => (
            <TabsTrigger key={strategy.id} value={strategy.id}>
              {strategy.name}
            </TabsTrigger>
          ))}
        </TabsList>
        {strategies.map((strategy) => (
          <TabsContent key={strategy.id} value={strategy.id}>
            <Card>
              <CardHeader>
                <CardTitle>{strategy.name}</CardTitle>
                <CardDescription>{strategy.objective}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>标的</TableHead>
                      <TableHead>市场</TableHead>
                      <TableHead>分数</TableHead>
                      <TableHead>动作</TableHead>
                      <TableHead>理由</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {strategy.rows.map((row) => (
                      <TableRow key={`${strategy.id}-${row.symbol}`}>
                        <TableCell>
                          <div>{row.name}</div>
                          <div className="font-mono text-xs text-muted-foreground">{row.symbol}</div>
                        </TableCell>
                        <TableCell>
                          <MarketBadge market={row.market} />
                        </TableCell>
                        <TableCell className="tabular-nums">{row.score.toFixed(1)}</TableCell>
                        <TableCell>{row.action}</TableCell>
                        <TableCell className="max-w-md whitespace-normal text-xs text-muted-foreground">
                          {row.reason}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {strategy.notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </>
  );
}
