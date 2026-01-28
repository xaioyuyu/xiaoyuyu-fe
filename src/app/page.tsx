export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-slate-50">
      {/* Hero 区：系统简介 */}
      <section className="mx-auto flex max-w-6xl flex-1 flex-col gap-8 px-4 py-10 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl space-y-6">
          <p className="inline rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
            智能化个人记账与消费分析系统
          </p>
          <h1 className="text-3xl font-bold leading-snug text-slate-900 md:text-4xl">
            让个人记账
            <span className="text-emerald-600"> 更简单、更智能</span>
          </h1>
          <p className="text-sm text-slate-600 md:text-base">
            自动聚合日常收支数据，智能分类并生成多维度消费分析报告，帮助你洞察消费习惯、制定理性预算，真正掌控每一分钱的去向。
          </p>
          <div className="flex flex-wrap gap-3">
            <button className="rounded-md bg-emerald-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700">
              立即开始记账
            </button>
            <button className="rounded-md border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:border-emerald-200 hover:text-emerald-700">
              查看分析示例
            </button>
          </div>
          <div className="flex flex-wrap gap-6 text-xs text-slate-500 md:text-sm">
            <div>
              <p className="font-semibold text-slate-700">多维度分析</p>
              <p>支持按时间、类别、商家等维度灵活筛选与对比。</p>
            </div>
            <div>
              <p className="font-semibold text-slate-700">智能洞察</p>
              <p>自动识别高频消费场景与异常支出，给出提示。</p>
            </div>
          </div>
        </div>

        {/* 右侧：数据概览卡片（静态示意） */}
        <div className="mt-6 w-full max-w-md rounded-2xl bg-white p-5 shadow-md md:mt-0">
          <h2 className="mb-4 text-sm font-semibold text-slate-800">本月消费概览（示例）</h2>
          <div className="mb-4 grid grid-cols-2 gap-3 text-xs md:text-sm">
            <div className="rounded-lg bg-emerald-50 p-3">
              <p className="text-slate-500">本月总支出</p>
              <p className="mt-1 text-lg font-semibold text-emerald-700">￥3,820.00</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-slate-500">预算使用率</p>
              <p className="mt-1 text-lg font-semibold text-slate-800">68%</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-slate-500">固定支出占比</p>
              <p className="mt-1 text-lg font-semibold text-slate-800">42%</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-slate-500">本月储蓄金额</p>
              <p className="mt-1 text-lg font-semibold text-slate-800">￥1,780.00</p>
            </div>
          </div>

          {/* 简易条形图示意 */}
          <div>
            <p className="mb-2 text-xs font-medium text-slate-600">主要消费类别分布</p>
            <div className="space-y-3 text-xs">
              <div>
                <div className="mb-1 flex justify-between text-[11px] text-slate-500">
                  <span>餐饮 & 日常饮食</span>
                  <span>38%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div className="h-2 w-[38%] rounded-full bg-emerald-500" />
                </div>
              </div>
              <div>
                <div className="mb-1 flex justify-between text-[11px] text-slate-500">
                  <span>交通出行</span>
                  <span>18%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div className="h-2 w-[18%] rounded-full bg-emerald-400" />
                </div>
              </div>
              <div>
                <div className="mb-1 flex justify-between text-[11px] text-slate-500">
                  <span>购物消费</span>
                  <span>26%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div className="h-2 w-[26%] rounded-full bg-emerald-300" />
                </div>
              </div>
              <div>
                <div className="mb-1 flex justify-between text-[11px] text-slate-500">
                  <span>其他</span>
                  <span>18%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div className="h-2 w-[18%] rounded-full bg-emerald-200" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 功能亮点区 */}
      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <h2 className="text-center text-xl font-semibold text-slate-900 md:text-2xl">
            为个人记账与消费分析而生的核心能力
          </h2>
          <p className="mt-2 text-center text-xs text-slate-500 md:text-sm">
            从数据采集到智能洞察，全流程打通，帮助你构建专属的个人财务「仪表盘」。
          </p>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-900">多渠道数据录入</p>
              <p className="mt-2 text-xs text-slate-600 md:text-sm">
                支持手动记账、模板导入等多种录入方式，适配不同使用习惯，保证数据完整性。
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-900">智能分类与标签</p>
              <p className="mt-2 text-xs text-slate-600 md:text-sm">
                基于规则与模型对账单进行自动分类与打标，减少重复操作，让记账更接近「一键完成」。
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-900">可视化消费分析</p>
              <p className="mt-2 text-xs text-slate-600 md:text-sm">
                提供按月度、类别、场景等维度的图表分析，帮助你快速发现高支出领域与节省空间。
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
