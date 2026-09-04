import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Disclaimer, MarketBadge } from "@/components/research";
import { api } from "@/lib/api";
import { getI18n } from "@/i18n/server";

export default async function StrategiesPage() {
  const { locale, t, tx } = await getI18n();
  const [meta, strategies] = await Promise.all([api.meta.get(), api.strategy.list()]);
  const first = strategies[0]?.id ?? "quality_value";

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">{t("strategies.title")}</h1>
      <Disclaimer locale={locale} text={meta.disclaimer} asOf={meta.as_of} live={meta.live} />
      <p className="text-sm text-muted-foreground">{t("strategies.lead")}</p>
      <Tabs defaultValue={first}>
        <TabsList>
          {strategies.map((strategy) => (
            <TabsTrigger key={strategy.id} value={strategy.id}>
              {tx(strategy.name)}
            </TabsTrigger>
          ))}
        </TabsList>
        {strategies.map((strategy) => (
          <TabsContent key={strategy.id} value={strategy.id}>
            <Card>
              <CardHeader>
                <CardTitle>{tx(strategy.name)}</CardTitle>
                <CardDescription>{tx(strategy.objective)}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("table.security")}</TableHead>
                      <TableHead>{t("table.market")}</TableHead>
                      <TableHead>{t("table.score")}</TableHead>
                      <TableHead>{t("table.action")}</TableHead>
                      <TableHead>{t("table.reason")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {strategy.rows.map((row) => (
                      <TableRow key={`${strategy.id}-${row.symbol}`}>
                        <TableCell>
                          <div>{tx(row.name)}</div>
                          <div className="font-mono text-xs text-muted-foreground">{tx(row.symbol)}</div>
                        </TableCell>
                        <TableCell>
                          <MarketBadge market={row.market} />
                        </TableCell>
                        <TableCell className="tabular-nums">{row.score.toFixed(1)}</TableCell>
                        <TableCell>{tx(row.action)}</TableCell>
                        <TableCell className="max-w-md whitespace-normal text-xs text-muted-foreground">
                          {tx(row.reason)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {strategy.notes.map((note) => (
                    <li key={note}>{tx(note)}</li>
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
