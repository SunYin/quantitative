import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Disclaimer, FactorList } from "@/components/research";
import { api } from "@/lib/api";
import { listReports } from "@/lib/data";

export function generateStaticParams() {
  return listReports().map((report) => ({ id: report.id }));
}

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let report;
  try {
    report = await api.report.get({ id });
  } catch {
    notFound();
  }
  const meta = await api.meta.get();

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">{report.title}</h1>
      <p className="text-muted-foreground">
        {report.broker} · {report.rating} · {report.symbol} · 目标价 {report.target_price ?? "—"} / 现价{" "}
        {report.current_price ?? "—"}
      </p>
      <Disclaimer text={meta.disclaimer} asOf={meta.as_of} live={meta.live} />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>评分 {report.score.grade}</CardTitle>
          </CardHeader>
          <CardContent>
            <FactorList score={report.score} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>抽取的逻辑</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Block title="逻辑句" items={report.claims.thesis_like} />
            <Block title="风险句" items={report.claims.risk_like} />
            <Block title="数字" items={report.claims.numbers} />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>正文</CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-7 text-muted-foreground">{report.body}</CardContent>
      </Card>
    </>
  );
}

function Block({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="mb-1 font-medium text-foreground">{title}</p>
      {items.length === 0 ? (
        <p className="text-muted-foreground">（无）</p>
      ) : (
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
