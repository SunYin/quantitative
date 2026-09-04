import { Disclaimer } from "@/components/research";
import { IndustryBoard } from "@/components/industry-board";
import { api } from "@/lib/api";
import { getI18n } from "@/i18n/server";

export default async function IndustriesPage() {
  const { locale, t } = await getI18n();
  const [meta, industries, chains, stocks] = await Promise.all([
    api.meta.get(),
    api.industry.list(),
    api.chain.list(),
    api.universe.list(),
  ]);
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">{t("industries.title")}</h1>
      <p className="text-sm text-muted-foreground">{t("industries.lead")}</p>
      <Disclaimer locale={locale} text={meta.disclaimer} asOf={meta.as_of} live={meta.live} />
      <IndustryBoard industries={industries} chains={chains} stocks={stocks} />
    </>
  );
}
