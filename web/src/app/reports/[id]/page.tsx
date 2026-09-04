import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Disclaimer, FactorList } from "@/components/research";
import { api } from "@/lib/api";
import { listReports } from "@/lib/data";
import { getI18n } from "@/i18n/server";

export function generateStaticParams() {
  return listReports().map((report) => ({ id: report.id }));
}

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { locale, t, tx } = await getI18n();
  let report;
  try {
    report = await api.report.get({ id });
  } catch {
    notFound();
  }
  const meta = await api.meta.get();

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">{tx(report.title)}</h1>
      <p className="text-muted-foreground">
        {tx(report.broker)} · {report.rating} · {report.symbol} · {t("reports.target")} {report.target_price ?? "—"} /{" "}
        {t("reports.spot")} {report.current_price ?? "—"}
      </p>
      <Disclaimer locale={locale} text={meta.disclaimer} asOf={meta.as_of} live={meta.live} />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              {t("reports.score")} {report.score.grade}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FactorList locale={locale} score={report.score} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("reports.extracted")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Block title={t("reports.thesis")} items={report.claims.thesis_like} tx={tx} empty={t("reports.none")} />
            <Block title={t("reports.risks")} items={report.claims.risk_like} tx={tx} empty={t("reports.none")} />
            <Block title={t("reports.numbers")} items={report.claims.numbers} tx={tx} empty={t("reports.none")} />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("reports.body")}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-7 text-muted-foreground">{tx(report.body)}</CardContent>
      </Card>
    </>
  );
}

function Block({
  title,
  items,
  tx,
  empty,
}: {
  title: string;
  items: string[];
  tx: (text: string) => string;
  empty: string;
}) {
  return (
    <div>
      <p className="mb-1 font-medium text-foreground">{title}</p>
      {items.length === 0 ? (
        <p className="text-muted-foreground">{empty}</p>
      ) : (
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          {items.map((item) => (
            <li key={item}>{tx(item)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
