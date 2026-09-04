import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Disclaimer } from "@/components/research";
import { api } from "@/lib/api";
import { getI18n } from "@/i18n/server";

export default async function ReportsPage() {
  const { locale, t, tx } = await getI18n();
  const [meta, reports] = await Promise.all([api.meta.get(), api.report.list()]);
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">{t("reports.title")}</h1>
      <Disclaimer locale={locale} text={meta.disclaimer} asOf={meta.as_of} live={meta.live} />
      <div className="grid gap-4 md:grid-cols-2">
        {reports.map((report) => (
          <Card key={report.id}>
            <CardHeader>
              <CardTitle className="text-base">
                <Link href={`/reports/${report.id}`} className="hover:underline">
                  {tx(report.title)}
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                {tx(report.broker)} · {report.rating} · {t("reports.quality")} {report.score.total.toFixed(1)} (
                {report.score.grade})
              </p>
              {report.score.flags.length > 0 ? (
                <ul className="list-disc pl-5 text-amber-200">
                  {report.score.flags.map((flag) => (
                    <li key={flag}>{tx(flag)}</li>
                  ))}
                </ul>
              ) : (
                <p>{t("reports.noFlags")}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("reports.checklist")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            {meta.checklist.map((item) => (
              <li key={item}>{tx(item)}</li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </>
  );
}
