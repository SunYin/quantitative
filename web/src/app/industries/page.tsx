import { Disclaimer } from "@/components/research";
import { IndustryBoard } from "@/components/industry-board";
import { api } from "@/lib/api";

export default async function IndustriesPage() {
  const [meta, industries, chains, stocks] = await Promise.all([
    api.meta.get(),
    api.industry.list(),
    api.chain.list(),
    api.universe.list(),
  ]);
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">行业吸引力</h1>
      <p className="text-sm text-muted-foreground">
        先看利润留在哪一层，再看该层样本个股。输入 AI 可解析上下游。样本地图不是投资建议。
      </p>
      <Disclaimer text={meta.disclaimer} asOf={meta.as_of} live={meta.live} />
      <IndustryBoard industries={industries} chains={chains} stocks={stocks} />
    </>
  );
}
