(function () {
  const STORAGE_KEY = "webschool-language";
  const LANGUAGES = ["en", "zh"];

  const exactTranslations = new Map(
    Object.entries({
      "SG Primary Schools Explorer": "新加坡小学浏览器",
      "Singapore Primary Schools Explorer": "新加坡小学浏览器",
      "SGSchooling Primary Dataset": "SGSchooling 小学数据集",
      "Verified school overview built from SGSchooling pages plus official directory and MOE ballot data, with 2025 ballot pressure, cutoff status, languages, contact details, and nearby context in one place.":
        "整合 SGSchooling、官方学校目录和 MOE 抽签数据，在一个页面查看 2025 抽签压力、截位状态、母语、联系方式和周边信息。",
      "Verified school overview built from SGSchooling pages plus official directory and MOE ballot data, with latest ballot pressure, cutoff status, languages, contact details, and nearby context in one place.":
        "整合 SGSchooling、官方学校目录和 MOE 抽签数据，在一个页面查看最新抽签压力、截位状态、母语、联系方式和周边信息。",
      "School Explorer": "学校浏览",
      "1km Home Suggestions": "1公里住房建议",
      "1km Condo Names": "1公里公寓名称",
      "School Condo Picks": "学校公寓推荐",
      "Investment Scout": "投资筛选",
      "Market Research": "市场研究",
      "AI Stocks": "AI 股票",
      "Loading data...": "正在加载数据...",
      "Schools: -": "学校：-",
      "Ranked: -": "排名：-",
      "Directory verified: -": "目录核验：-",
      "2025 ballot: -": "2025 抽签：-",
      "Latest ballot: -": "最新抽签：-",
      "Condo candidates: -": "公寓候选：-",
      "HDB suggestions: -": "HDB 建议：-",
      "Condo names: -": "公寓名称：-",
      "Search school, town, or address": "搜索学校、城镇或地址",
      "All schools": "全部学校",
      "Ranked in PSLE 2025 table": "在 PSLE 2025 表中有排名",
      "Not in ranking table": "未进入排名表",
      "Sort by community rank": "按社区排名排序",
      "Sort by 2025 2C(S)->2C applied/vacancy (hard to easy)": "按 2025 2C(S)->2C 申请/名额排序（难到易）",
      "Sort by latest 2C(S)->2C applied/vacancy (hard to easy)": "按最新 2C(S)->2C 申请/名额排序（难到易）",
      "Sort by name": "按名称排序",
      "Sort by town": "按城镇排序",
      "Primary Schools": "小学",
      "0 results": "0 个结果",
      "Select a school to view details.": "选择一所学校查看详情。",
      "PSLE 2025 Community Ranking": "PSLE 2025 社区排名",
      "Rank": "排名",
      "School": "学校",
      "Score Range": "分数范围",
      "Students": "学生数",
      "Total in Cohort": "同届总人数",
      "%": "%",
      "Top 10% Avg AL": "前 10% 平均 AL",
      "Sources:": "来源：",
      "MOE 2025 vacancies and balloting data": "MOE 2025 名额和抽签数据",
      "MOE vacancies and balloting data": "MOE 名额和抽签数据",
      "cached MOE school directory data, and OneMap/data.gov.sg enrichment where shown.":
        "缓存的 MOE 学校目录数据，以及页面中展示的 OneMap/data.gov.sg 补充数据。",
      "No schools match the current filters.": "没有学校符合当前筛选条件。",
      "No school selected.": "尚未选择学校。",
      "Unknown town": "未知城镇",
      "No data available.": "暂无数据。",
      "No mother-tongue table found.": "未找到母语课程表。",
      "Regular": "普通",
      "Higher": "高级",
      "No regular mother-tongue data": "暂无普通母语数据",
      "No higher mother-tongue data": "暂无高级母语数据",
      "No 2025 data": "暂无 2025 数据",
      "Oversubscribed": "超额申请",
      "Within vacancy": "名额充足",
      "No CCA profile found.": "暂无 CCA 资料。",
      "Official directory verified": "官方目录已核验",
      "Directory match unavailable": "暂无目录匹配",
      "2025 ballot record": "有 2025 抽签记录",
      "No 2025 ballot row": "无 2025 抽签行",
      "Official MOE cutoff": "官方 MOE 截位",
      "No official MOE cutoff": "无官方 MOE 截位",
      "Mapped location": "已定位",
      "No mapped location": "无定位",
      "School website linked": "已链接学校网站",
      "Website missing": "暂无网站",
      "No ballot history table found.": "未找到抽签历史表。",
      "Verified Overview": "核验概览",
      "Town": "城镇",
      "Address": "地址",
      "Type": "类型",
      "Affiliations": "附属关系",
      "Zone": "区域",
      "Session": "上课时段",
      "Level": "年级",
      "Principal": "校长",
      "Contact & Access": "联系方式与交通",
      "Telephone": "电话",
      "Alt telephone": "备用电话",
      "Email": "邮箱",
      "Nearest MRT": "最近 MRT",
      "Bus": "公交",
      "Social": "社交媒体",
      "2025 Ballot Pressure": "2025 抽签压力",
      "Verified School Summary": "学校核验摘要",
      "Programmes & Languages": "课程与语言",
      "Programme tags": "课程标签",
      "Mother tongue offerings": "母语课程",
      "Open SGSchooling page": "打开 SGSchooling 页面",
      "School website": "学校网站",
      "CCA Snapshot": "CCA 概览",
      "Source Coverage": "来源覆盖",
      "Ballot History": "抽签历史",
      "Year": "年份",
      "Metric": "指标",
      "Vacancy": "名额",
      "Applied": "申请",
      "Taken": "录取",
      "Showing latest 8 years from SGSchooling ballot history.": "显示 SGSchooling 抽签历史中的最近 8 年。",
      "Condo Names Within 1km of Primary Schools": "小学 1 公里内公寓名称",
      "Condo Names": "公寓名称",
      "Nearby condo/apartment place names from OneMap, without sales listing data.": "来自 OneMap 的周边公寓/住宅地点名称，不含销售挂牌数据。",
      "Condo Picks": "公寓推荐",
      "Top 5 Condos Around Each Primary School": "每所小学周边 Top 5 公寓",
      "Select a school to see the five strongest nearby condo candidates, ranked by latest P1 ballot pressure, distance, private-condo confidence, and data quality.":
        "选择一所学校，查看周边五个最强公寓候选；排序依据包括最新 P1 抽签压力、距离、私宅可信度和数据质量。",
      "Search school, town, or condo": "搜索学校、城镇或公寓",
      "Select school": "选择学校",
      "Sort schools by latest ballot pressure": "按最新抽签压力排序学校",
      "Sort schools by condo candidate count": "按公寓候选数量排序学校",
      "Sort schools by name": "按学校名排序",
      "Sort schools by town": "按城镇排序",
      "Schools With Condo Candidates": "有公寓候选的学校",
      "Select a school to view its recommended condo candidates.": "选择一所学校查看推荐公寓候选。",
      "Condo candidates come from OneMap place-name enrichment in the local school dataset. Ranking uses the latest available P1 ballot applied/vacancy pressure; verify exact project status, tenure, age, transactions, and MOE home-school distance before making a purchase decision.":
        "公寓候选来自本地学校数据中的 OneMap 地点名称补充。排序使用最新可用 P1 抽签申请/名额压力；购房前请核实具体项目状态、产权、楼龄、成交和 MOE 住家到学校距离。",
      "Top 5 Recommended Condo Candidates": "Top 5 推荐公寓候选",
      "How to use this shortlist": "如何使用这份候选清单",
      "Verify MOE home-school distance": "核验 MOE 住家到学校距离",
      "Check tenure and TOP": "检查产权和 TOP",
      "Compare recent caveats": "比较近期成交备案",
      "Inspect unit stack and layout": "检查单位朝向和户型",
      "Top picks": "推荐数量",
      "Private candidates": "私宅候选",
      "Nearest pick": "最近推荐",
      "Ballot demand": "抽签需求",
      "Needs check": "需核验",
      "Likely private: -": "疑似私宅：-",
      "Search school name or town": "搜索学校名或城镇",
      "Sort by school name": "按学校名排序",
      "Sort by condo count": "按公寓数量排序",
      "Likely private condos only": "仅显示疑似私人公寓",
      "All OneMap place records": "全部 OneMap 地点记录",
      "Select a school to view nearby condo names.": "选择一所学校查看附近公寓名称。",
      "No matching schools.": "没有匹配的学校。",
      "Nearby Condo Names Within 1km": "1 公里内附近公寓名称",
      "Condo Name": "公寓名称",
      "Distance": "距离",
      "Source": "来源",
      "Shown": "当前显示",
      "Likely private": "疑似私宅",
      "All records": "全部记录",
      "Nearest shown": "最近显示项",
      "Homes Within 1km of Primary Schools": "小学 1 公里内住房",
      "Housing Suggestions": "住房建议",
      "Recent HDB resale transactions near each school, filtered to SGD 500k–2M.": "每所学校附近近期 HDB 转售交易，筛选范围为 50 万至 200 万新元。",
      "With HDB matches: -": "有 HDB 匹配：-",
      "Recent HDB rows: -": "近期 HDB 记录：-",
      "HDB months: -": "HDB 月份：-",
      "Sort by homes count": "按住房数量排序",
      "Select a school to view nearby home suggestions.": "选择一所学校查看附近住房建议。",
      "Suggested Homes Within 1km": "1 公里内住房建议",
      "Price": "价格",
      "Area (sqm)": "面积（平方米）",
      "Month": "月份",
      "Listing": "链接",
      "Matches": "匹配数",
      "Lowest price": "最低价",
      "Nearest": "最近",
      "Largest": "最大面积",
      "No recent match": "暂无近期匹配",
      "No recent matches within 1km.": "1 公里内暂无近期匹配。",
      "CCR/RCR/OCR Condo Investment Scout": "CCR/RCR/OCR 公寓投资筛选",
      "CCR / RCR / OCR Condo Investment Scout": "CCR / RCR / OCR 公寓投资筛选",
      "A curated shortlist of current CCR, RCR, and OCR condo listings filtered for investment-style traits: around SGD 2M, above 800 sqft, near MRT, under 10 years old, and with primary-school demand signals.":
        "精选当前 CCR、RCR、OCR 公寓清单，筛选条件包括约 200 万新元、800 平方英尺以上、靠近 MRT、楼龄 10 年以内，并带有小学需求信号。",
      "Listings: -": "房源：-",
      "Coverage: -": "覆盖：-",
      "School signals: -": "学校信号：-",
      "Search condo, corridor, MRT, or school": "搜索公寓、走廊、MRT 或学校",
      "All CCR / RCR / OCR": "全部 CCR / RCR / OCR",
      "CCR only": "仅 CCR",
      "RCR only": "仅 RCR",
      "OCR only": "仅 OCR",
      "With school signal": "有学校信号",
      "All shortlisted listings": "全部入围房源",
      "All choices": "全部选项",
      "Verified live listings only": "仅已核验实时房源",
      "Expanded candidates only": "仅扩展候选",
      "Sort by investment score": "按投资评分排序",
      "Sort by price": "按价格排序",
      "Sort by MRT distance": "按 MRT 距离排序",
      "Sort by size": "按面积排序",
      "Sort by youngest": "按楼龄从新到旧排序",
      "Max price": "最高价格",
      "Min size (sqft)": "最小面积（平方英尺）",
      "Max MRT distance (m)": "最大 MRT 距离（米）",
      "Max age (years)": "最大楼龄（年）",
      "Shortlist": "入围清单",
      "Select a condo shortlist item to inspect its fit.": "选择一个公寓入围项查看匹配度。",
      "Top 50 Condos": "前 50 个公寓",
      "Condo": "公寓",
      "Status": "状态",
      "Score": "评分",
      "Size": "面积",
      "Age": "楼龄",
      "MRT": "MRT",
      "School signal": "学校信号",
      "No listings match the current criteria.": "没有房源符合当前条件。",
      "No condo selected.": "尚未选择公寓。",
      "No school signal": "无学校信号",
      "Live": "实时",
      "Candidate": "候选",
      "Price TBD": "价格待确认",
      "Size TBD": "面积待确认",
      "MRT corridor TBD": "MRT 走廊待确认",
      "MRT distance TBD": "MRT 距离待确认",
      "TBD": "待确认",
      "School demand signal": "学校需求信号",
      "Live listing": "实时房源",
      "Expanded candidate": "扩展候选",
      "Why It Made The Shortlist": "入围原因",
      "Listing Snapshot": "房源快照",
      "Core facts": "核心信息",
      "Needs live check": "需实时核验",
      "Beds / baths": "卧室 / 卫浴",
      "Tenure": "产权",
      "Access & age": "交通与楼龄",
      "Walk distance": "步行距离",
      "School distance": "学校距离",
      "TOP year": "TOP 年份",
      "Current age": "当前楼龄",
      "Listed on": "挂牌日期",
      "Candidate only": "仅候选",
      "Investment Score Breakdown": "投资评分拆解",
      "Primary-School Demand Signals": "小学需求信号",
      "Open source listing": "打开来源房源",
      "Source Note": "来源说明",
      "Budget fit": "预算匹配",
      "Size fit": "面积匹配",
      "MRT fit": "MRT 匹配",
      "Age fit": "楼龄匹配",
      "Value fit": "价值匹配",
      "School fit": "学校匹配",
      "Around SGD 2M": "约 200 万新元",
      "Above 800 sqft": "800 平方英尺以上",
      "Near MRT": "靠近 MRT",
      "Age under 10y": "楼龄 10 年以内",
      "Singapore Condo Market Research 2026-2031": "新加坡公寓市场研究 2026-2031",
      "Singapore Condo Upside Research 2026-2031": "新加坡公寓上涨潜力研究 2026-2031",
      "A data-backed investment screen for private condos that have a plausible path to more than 20% capital appreciation over five years. The page combines URA market signals, LTA rail catalysts, local school-demand data, and this site's condo shortlist.":
        "一个基于数据的私人公寓投资筛选页，寻找未来五年具备超过 20% 资本增值路径的项目。页面结合 URA 市场信号、LTA 轨道催化、本地学校需求数据和本站公寓清单。",
      "As of 13 May 2026": "截至 2026 年 5 月 13 日",
      "Target: >20% in 5 years": "目标：5 年 >20%",
      "Required CAGR: about 3.7%": "所需 CAGR：约 3.7%",
      "Focus: private condos, not HDBs": "重点：私人公寓，不含 HDB",
      "Important limit:": "重要限制：",
      "This is a research screen, not financial advice or a guarantee. The 20% target excludes buyer stamp duty, ABSD, legal fees, maintenance, mortgage cost, tax, and selling cost. Before buying, verify unit-level caveats, stack/facing, defects, MCST health, rental evidence, and financing.":
        "这是研究筛选页，不是财务建议，也不是收益保证。20% 目标没有扣除买方印花税、ABSD、律师费、维护费、贷款成本、税费和卖出成本。买入前必须核验具体单位备案、朝向/楼层、缺陷、MCST 状况、租金证据和融资条件。",
      "Launch / TOP Forms": "新盘 / TOP 表格",
      "Incoming launches and near-TOP condos": "即将推出与接近 TOP 的公寓",
      "These forms are now placed at the top because they are action lists. The first ranks projects that are coming to market. The second ranks launched projects already under construction and approaching TOP, including Pinetree Hill and Nava Grove. The third captures older but well-located long-tenure condos. The fourth fixes the missing-data gap for mature 99-year leasehold condos such as Gardenvista.":
        "这些表格放在页面顶部，因为它们是行动清单。第一张表排序即将入市的项目。第二张表排序已经开盘、在建并接近 TOP 的项目，包括 Pinetree Hill 和 Nava Grove。第三张表收录位置较好的老牌长产权公寓。第四张表补上成熟 99 年限项目的数据缺口，例如 Gardenvista。",
      "Form 1: Incoming new launches": "表 1：即将推出的新盘",
      "Form 2: TOP / under-construction watchlist": "表 2：TOP / 在建观察清单",
      "Form 3: Older long-tenure condo watchlist": "表 3：较老长产权公寓观察清单",
      "Screen rule: freehold, 999-year, or otherwise more-than-100-year land tenure. “Good condition” is not assumed from project age; inspect the actual unit, estate upkeep, MCST funds, facade, lifts, waterproofing, and renovation quality before treating any row as investable.":
        "筛选规则：freehold、999 年限，或其他超过 100 年的土地年限。不能只凭项目年份假设“状态好”；把任何一行视为可投资前，都要检查具体单位、社区维护、MCST 资金、外立面、电梯、防水和装修质量。",
      "Form 4: Mature 99-year leasehold condo watchlist": "表 4：成熟 99 年租赁产权公寓观察清单",
      "Recheck result: some useful mature projects were absent because Form 3 intentionally filtered for freehold, 999-year, or more-than-100-year land tenure. This new form keeps only 99-year leasehold projects, generally TOP 2016 or earlier, where transport, school, employment, waterfront, or transformation catalysts can still create upside. Freehold projects such as The Cascadia stay out of this form even when they are nearby.":
        "重新核对结果：一些有用的成熟项目之前缺失，是因为表 3 有意只筛 freehold、999 年限或超过 100 年的土地年限。这张新表只保留 99 年限项目，通常为 TOP 2016 或更早，并且仍可能由交通、学校、就业节点、滨水或区域更新催化带来上涨空间。The Cascadia 这类 freehold 项目即使位置接近，也不会放入此表。",
      "Launch / Site": "新盘 / 地块",
      "Region": "区域",
      "Location": "位置",
      "Type": "类型",
      "Window": "窗口",
      "Units": "单位数",
      "Upside": "上涨潜力",
      "Why it ranks here": "排名理由",
      "Watch-out": "注意事项",
      "Project": "项目",
      "Condition angle": "状态角度",
      "Why previously missing": "此前缺失原因",
      "Market Baseline": "市场基线",
      "What the public data says now": "公开数据当前显示什么",
      "A 20% gain in five years needs roughly 3.7% annual growth. That is slightly above Singapore's 2025 private-market gain, so the best candidates need project-specific catalysts rather than just market beta.":
        "五年上涨 20% 大约需要 3.7% 的年化增长率。这略高于新加坡 2025 年私人住宅整体涨幅，因此最好的候选项目不能只依赖大盘，而需要项目自身的催化因素。",
      "Investment Thesis": "投资论点",
      "Where the upside is most likely to come from": "上涨潜力最可能来自哪里",
      "1. OCR and selected RCR look stronger than expensive CCR": "1. OCR 和部分 RCR 比高价 CCR 更有弹性",
      "URA's latest quarter shows OCR non-landed prices rising faster than RCR and CCR. That does not mean every OCR condo is attractive; it means affordability and upgrader depth are still powerful.":
        "URA 最新季度显示 OCR 非有地住宅涨幅快于 RCR 和 CCR。这并不代表每个 OCR 公寓都值得买，而是说明可负担性和升级买家深度仍然很有力量。",
      "2. Rail catalysts matter only when entry price has not fully priced them in": "2. 轨道交通催化只有在买入价未充分反映时才有意义",
      "The strongest five-year window is where the market can see a rail opening before or near exit, especially CRL1 around 2030 and selected integrated MRT nodes.":
        "最强的五年窗口，是市场能在退出前或退出附近看到轨道开通的地方，尤其是约 2030 年的 CRL1 以及部分综合 MRT 节点。",
      "3. Good primary-school demand improves exit liquidity": "3. 好小学需求能提高退出流动性",
      "The site already scores schools using 2025 2C(S) and 2C pressure. Condos near high-demand schools have a deeper family-buyer pool, but only if the unit is actually within the useful distance band.":
        "本站已经使用 2025 年 2C(S) 和 2C 压力给学校打分。靠近高需求小学的公寓有更深的家庭买家池，但前提是具体单位确实落在有用的距离范围内。",
      "4. Supply is the main brake on aggressive forecasts": "4. 供应量是激进预测的主要刹车",
      "URA's pipeline is large. A project needs scarcity, transport, school demand, or an entry discount to outperform the broad market enough to cross 20%.":
        "URA 管道供应量不小。项目需要稀缺性、交通、学校需求或入场折价，才可能跑赢大盘并跨过 20% 门槛。",
      "Ranked Picks": "排名精选",
      "Condos with the clearest five-year >20% path": "五年 >20% 路径最清晰的公寓",
      "The base range is my conservative screen. A project is a real 20% candidate only when the upper end of base case reaches or exceeds 20%, and the actual unit is bought below comparable replacement-cost pressure.":
        "基准区间是保守筛选。只有当基准情景上沿达到或超过 20%，并且具体单位买入价低于可比替代新盘的成本压力时，项目才算真正的 20% 候选。",
      "Requested Case Studies": "指定案例研究",
      "Eight Riversuites and Twin Waterfalls": "Eight Riversuites 与 Twin Waterfalls",
      "These two are not the same kind of bet. Eight Riversuites is a city-fringe RCR transport/liquidity play. Twin Waterfalls is an OCR family-size and fully-privatised EC play. Both can work, but only one has a cleaner path to a 20% five-year outcome.":
        "这两个项目不是同一种投资逻辑。Eight Riversuites 是城市边缘 RCR 的交通/流动性逻辑；Twin Waterfalls 是 OCR 家庭面积和完全私有化 EC 逻辑。两者都可能成立，但只有一个通向五年 20% 的路径更清晰。",
      "Quick Compare": "快速对比",
      "Forecast summary table, including requested cases": "预测汇总表，含指定案例",
      "Area": "区域",
      "Base 5y": "5 年基准",
      "Bull 5y": "5 年牛市",
      "Conviction": "置信度",
      "Data status": "数据状态",
      "How To Use": "如何使用",
      "The buying checklist before trusting any upside number": "相信上涨数字前的购买检查清单",
      "Pull URA caveats for the exact project and compare 2023-2026 psf trend by bedroom type.":
        "拉取具体项目的 URA caveats，并按卧室类型比较 2023-2026 年 psf 走势。",
      "Reject units that are not meaningfully cheaper than nearby new-launch alternatives after age adjustment.":
        "如果按楼龄调整后，具体单位没有明显低于附近新盘替代品，应直接排除。",
      "Check walking distance, not marketing distance, to MRT and primary school gates.":
        "核验到 MRT 和小学大门的实际步行距离，不要只看营销距离。",
      "Prefer efficient layouts above 800 sqft with a broad buyer pool; avoid odd layouts and poor stacks.":
        "优先选择 800 平方英尺以上、户型高效且买家池较广的单位；避开户型奇怪和位置差的 stack。",
      "Stress-test mortgage at a higher rate than today's package; do not rely on rate cuts to save the thesis.":
        "用高于当前配套的利率做贷款压力测试，不要依赖降息来拯救投资逻辑。",
      "Deduct buyer/seller costs. A 20% headline gain may be much lower after friction.":
        "扣除买卖双方成本。表面 20% 涨幅在交易摩擦后可能低很多。",
      "Public data used": "使用的公开数据",
      "This report is built for screening and discussion. It should be refreshed when URA releases the next quarterly statistics or when a target project has new caveats that materially change its entry price.":
        "本报告用于筛选和讨论。URA 发布下一季度统计，或目标项目出现会显著改变入场价的新成交备案时，应刷新本页。",
      "High": "高",
      "Medium-high": "中高",
      "Medium": "中",
      "Selective": "选择性",
      "Project candidate": "项目候选",
      "Live listing verified": "实时房源已核验",
      "Requested case study": "指定案例研究",
      "Current fit": "当前匹配",
      "Transport": "交通",
      "Why": "原因",
      "Risks": "风险",
      "Why it can re-rate": "重估原因",
      "Main risk": "主要风险",
      "Verdict": "结论",
      "AI Stocks 4x Research 2026-2031": "AI 股票四倍研究 2026-2031",
      "AI Equity Research": "AI 股票研究",
      "Market Read": "市场观察",
      "Screening Rules": "筛选规则",
      "Top Candidates": "候选排名",
      "Recommendation": "建议",
      "Watchlist Checklist": "观察清单",
      "Sources": "来源"
    })
  );

  const phraseTranslations = [
    ["Data generated:", "数据生成："],
    ["Schools:", "学校："],
    ["Ranked:", "排名："],
    ["Directory verified:", "目录核验："],
    ["2025 ballot:", "2025 抽签："],
    ["Latest ballot:", "最新抽签："],
    ["HDB suggestions:", "HDB 建议："],
    ["Condo names:", "公寓名称："],
    ["Condo candidates:", "公寓候选："],
    ["Likely private:", "疑似私宅："],
    ["With HDB matches:", "有 HDB 匹配："],
    ["Recent HDB rows:", "近期 HDB 记录："],
    ["HDB months:", "HDB 月份："],
    ["Listings:", "房源："],
    ["Coverage:", "覆盖："],
    ["School signals:", "学校信号："],
    ["live", "实时"],
    ["candidates", "候选"],
    ["results", "个结果"],
    ["picks", "个推荐"],
    ["Top:", "首选："],
    ["Latest ballot year", "最新抽签年份"],
    ["from school", "距学校"],
    ["Sort #", "排序 #"],
    ["Rank:", "排名："],
    ["Unranked", "未排名"],
    ["Likely private", "疑似私宅"],
    ["place records", "地点记录"],
    ["records", "记录"],
    ["Nearest", "最近"],
    ["Latest", "最新"],
    ["From", "最低"],
    ["HDB matches", "HDB 匹配"],
    ["school signals", "个学校信号"],
    ["No official MOE cutoff published for this phase.", "MOE 未发布此阶段的官方截位。"],
    ["Balloting required", "需要抽签"],
    ["No balloting", "无需抽签"],
    ["Balloted applicants", "参与抽签申请人"],
    ["Balloted places", "抽签名额"],
    ["Official MOE 2025 result", "MOE 2025 官方结果"],
    ["Official MOE 2026 result", "MOE 2026 官方结果"],
    ["No 2026 data", "暂无 2026 数据"],
    ["No 2026 places", "2026 无名额"],
    ["Applied", "申请"],
    ["Vacancy", "名额"],
    ["Taken", "录取"],
    ["Pressure is shown as applied/vacancy. Values above 1.00x mean the phase was oversubscribed. Each phase card shows the official MOE 2025 citizen and distance cutoff for that phase.",
      "压力以申请/名额显示。高于 1.00x 表示该阶段超额申请。每张阶段卡片显示 MOE 2025 官方公民身份与距离截位。"],
    ["Profile and ballot history come from SGSchooling. The per-phase cutoff line comes from MOE's 2025 vacancies and balloting data page. Verified identity, contact, and school directory details come from the cached official school directory when a match is available.",
      "学校资料和抽签历史来自 SGSchooling。各阶段截位来自 MOE 2025 名额与抽签数据页。身份、联系方式和学校目录详情在可匹配时来自缓存的官方学校目录。"],
    ["2026 source has vacancy/applied/taken counts; citizen and distance cutoff should be verified separately.",
      "2026 来源提供名额、申请和录取数；公民身份与距离截位需另行核验。"],
    ["Pressure is shown as applied/vacancy. Values above 1.00x mean the phase was oversubscribed. 2026 numeric counts are from the latest MOE-derived open dataset; citizen and distance cutoff lines appear only where available.",
      "压力以申请/名额显示。高于 1.00x 表示该阶段超额申请。2026 数值来自最新 MOE 衍生开放数据集；公民身份与距离截位仅在来源提供时显示。"],
    ["Profile and ballot history come from SGSchooling. Latest vacancy, applied, and taken counts are refreshed from PrimarySch's MOE-derived 2023-2026 open dataset. Citizen/distance cutoff details remain shown only where the source exposes them. Verified identity, contact, and school directory details come from the cached official school directory when a match is available.",
      "学校资料和抽签历史来自 SGSchooling。最新名额、申请和录取数由 PrimarySch 的 MOE 衍生 2023-2026 开放数据集刷新。公民/距离截位仅在来源提供时显示；身份、联系方式和学校目录详情在可匹配时来自缓存的官方学校目录。"],
    ["Ranking blends school demand, distance, private-condo name confidence, address quality, and source quality. It does not yet score price, tenure, TOP, floor plan, or transaction history.",
      "排序综合学校需求、距离、私宅名称可信度、地址质量和来源质量；尚未评分价格、产权、TOP、户型或成交历史。"],
    ["Default view hides obvious HDB/public-estate/noisy OneMap records. Switch to “All OneMap place records” if you want the raw enrichment list.",
      "默认视图隐藏明显的 HDB、公共住宅区和噪声 OneMap 记录。如需原始补充列表，可切换到“全部 OneMap 地点记录”。"],
    ["Source: refreshed data.gov.sg HDB resale data. Suggestions are transaction-based, not live listings; private condos are handled on the Investment Scout and Market Research pages.",
      "来源：刷新的 data.gov.sg HDB 转售数据。建议基于交易记录，不是实时挂牌；私人公寓请查看“投资筛选”和“市场研究”页面。"]
  ];

  const chineseSourceTranslations = new Map(
    Object.entries({
      "目标不是预测一定上涨，而是筛出未来五年最有机会走出 4x 以上回报的中国和美国 AI 产业链股票。":
        "The goal is not to promise gains, but to screen China and U.S. AI value-chain stocks with the best chance of a 4x+ return over the next five years.",
      "4x 需要约 31.9% 年化收益率，因此只看仍有足够市值弹性、业绩兑现速度快、并且直接受益于 AI 算力周期的公司。":
        "A 4x outcome needs roughly a 31.9% annualized return, so this page focuses on companies with market-cap elasticity, fast earnings delivery, and direct exposure to the AI compute cycle.",
      "本页是研究框架，不是个性化投资建议、收益承诺或买卖指令。AI 股票波动极高，4x 候选通常也意味着估值、融资、":
        "This page is a research framework, not personalized investment advice, a return promise, or a buy/sell instruction. AI equities are highly volatile, and 4x candidates usually carry higher valuation, financing,",
      "客户集中、出口管制、技术路线切换和订单兑现风险更高。实际交易前应核验实时股价、市值、财报原文、持仓限制和税务成本。":
        "customer concentration, export-control, technology-roadmap, and order-delivery risks. Before trading, verify real-time prices, market cap, filings, position limits, and tax costs.",
      "中美 AI 股票四倍候选研究 2026-2031": "China and U.S. AI Stocks 4x Candidate Research 2026-2031",
      "目标不是预测一定上涨，而是筛出未来五年最有机会走出 4x 以上回报的中国和美国 AI 产业链股票。 4x 需要约 31.9% 年化收益率，因此只看仍有足够市值弹性、业绩兑现速度快、并且直接受益于 AI 算力周期的公司。":
        "The goal is not to promise gains, but to screen China and U.S. AI value-chain stocks with the best chance of a 4x+ return over five years. A 4x outcome needs about a 31.9% annualized return, so this page focuses on companies with market-cap elasticity, fast earnings delivery, and direct exposure to the AI compute cycle.",
      "更新：2026-05-14": "Updated: 2026-05-14",
      "目标：5 年 4x+": "Target: 5-year 4x+",
      "所需 CAGR：约 31.9%": "Required CAGR: about 31.9%",
      "市场：美股 / A 股": "Markets: U.S. stocks / A-shares",
      "定位：高风险研究清单": "Positioning: high-risk research list",
      "重要限制：": "Important limit:",
      "最近 AI 股市进展：资金从“模型叙事”流向“算力兑现”": "Recent AI Market Shift: From Model Narratives To Compute Delivery",
      "2026 年 AI 交易的核心变化，是市场不再只奖励大模型故事，而是更挑剔地寻找能把 AI 资本开支转成收入、利润和现金流的公司。":
        "The key change in 2026 AI trading is that the market no longer rewards model stories alone. It is looking harder for companies that can turn AI capex into revenue, profit, and cash flow.",
      "微软、亚马逊、Alphabet、Meta 等云厂商继续扩大 AI 数据中心支出，资本开支能否转成云收入是美股 AI 交易的主线。":
        "Microsoft, Amazon, Alphabet, Meta, and other cloud platforms continue to expand AI data-center spending. Whether capex turns into cloud revenue is the main U.S. AI equity question.",
      "CoreWeave、Nebius、IREN 等 AI 云公司以长约和电力资源争夺估值溢价，胜负手从 GPU 数量转向交付能力和融资成本。":
        "AI cloud companies such as CoreWeave, Nebius, and IREN compete for valuation premiums through long contracts and power resources; the edge is shifting from GPU counts to delivery ability and financing cost.",
      "AI 集群扩大后，瓶颈从单颗 GPU 延伸到机架级互联、光模块、CPO 和低功耗高速连接，这是中美共同的高弹性环节。":
        "As AI clusters expand, bottlenecks move from single GPUs to rack-scale interconnect, optical modules, CPO, and low-power high-speed connectivity, a high-elasticity segment in both China and the U.S.",
      "中国 AI 芯片和算力基础设施受到政策、出口管制和国内模型需求共同推动，但估值已经很拥挤，必须用利润兑现来消化。":
        "China AI chips and compute infrastructure are pushed by policy, export controls, and domestic model demand, but valuations are crowded and need earnings delivery to digest them.",
      "电力、土地、液冷和数据中心建设速度成为新的护城河，拥有可交付电力的 AI 云和代建公司比纯概念股更值得跟踪。":
        "Power, land, liquid cooling, and data-center build speed are becoming new moats. AI cloud and buildout companies with deliverable power are more worth tracking than pure concept stocks.",
      "AI 订单高度集中，任何客户砍单、芯片路线改变、融资收紧或监管变化，都可能让高估值股票快速回撤 30%-60%。":
        "AI orders are highly concentrated. Customer cuts, chip-roadmap shifts, tighter financing, or regulation changes can pull high-valuation stocks down 30%-60% quickly.",
      "国产替代": "Domestic substitution",
      "高波动": "High volatility",
      "筛选方法：先排除“好公司但难 4x”的巨头": "Screening Method: Exclude Giants That Are Good But Hard To 4x",
      "英伟达、微软、台积电、Broadcom、腾讯、阿里等可能仍是优秀 AI 核心资产，但以当前体量看，五年再涨 4 倍需要极高市值扩张。":
        "Nvidia, Microsoft, TSMC, Broadcom, Tencent, Alibaba, and similar giants may still be excellent AI core assets, but at their current scale a further 4x in five years would require enormous market-cap expansion.",
      "本页更偏向中小市值或利润率仍在跃迁阶段的“高弹性直接受益者”。":
        "This page favors smaller companies or those still in a margin step-change phase: high-elasticity direct beneficiaries.",
      "英伟达、微软、台积电、Broadcom、腾讯、阿里等可能仍是优秀 AI 核心资产，但以当前体量看，五年再涨 4 倍需要极高市值扩张。 本页更偏向中小市值或利润率仍在跃迁阶段的“高弹性直接受益者”。":
        "Nvidia, Microsoft, TSMC, Broadcom, Tencent, Alibaba, and similar giants may still be excellent AI core assets, but at their current scale a further 4x in five years would require enormous market-cap expansion. This page favors smaller companies or those still in a margin step-change phase.",
      "1. 收入曲线": "1. Revenue Curve",
      "已经出现 40%+ 同比增长，或有可验证订单/合同支撑未来两年增长，而不是只靠远期故事。":
        "Already showing 40%+ year-on-year growth, or backed by verifiable orders/contracts for the next two years, not only a distant story.",
      "2. 市值弹性": "2. Market-Cap Elasticity",
      "五年 4x 后仍能落在合理行业市值区间；市值越大，必须要求更强利润率和现金流证据。":
        "Even after a 5-year 4x, the company should still sit in a plausible sector market-cap range. The larger the company, the stronger the required margin and cash-flow proof.",
      "3. 技术卡位": "3. Technology Positioning",
      "优先选 AI 云、光互联、机架级连接、国产 AI 芯片、AI 服务器等确定性支出环节。":
        "Prioritize spending pools with clearer visibility: AI cloud, optical interconnect, rack-scale connectivity, domestic AI chips, and AI servers.",
      "4. 反证条件": "4. Disconfirming Signals",
      "一旦订单延迟、毛利率下滑、应收账款异常、客户集中恶化或估值超过利润兑现速度，应降级。":
        "Downgrade when orders slip, gross margin falls, receivables look abnormal, customer concentration worsens, or valuation outruns earnings delivery.",
      "最值得跟踪的 10 只 4x 候选股": "The 10 4x Candidates Most Worth Tracking",
      "“4x 置信度”表示在牛市情景中跨过 4 倍门槛的相对概率，不代表安全边际。排序综合了业务纯度、成长速度、估值弹性和风险可控性。":
        "“4x confidence” means the relative chance of crossing the 4x threshold in a bull case. It is not a margin of safety. The ranking blends business purity, growth speed, valuation elasticity, and controllable risk.",
      "排名": "Rank",
      "股票": "Stock",
      "市场": "Market",
      "AI 环节": "AI Segment",
      "4x 置信度": "4x Confidence",
      "5 年牛市路径": "5-Year Bull Path",
      "核心理由": "Core Rationale",
      "最大风险": "Biggest Risk",
      "美国 / Nasdaq": "U.S. / Nasdaq",
      "中国 A 股": "China A-shares",
      "中国 A 股 / 科创板": "China A-shares / STAR Market",
      "AI 云、GPU 集群、电力": "AI cloud, GPU clusters, power",
      "AI 数据中心高速互联、AEC、SerDes": "AI data-center high-speed interconnect, AEC, SerDes",
      "800G / 1.6T 光模块": "800G / 1.6T optical modules",
      "PCIe/CXL/以太网连接、机架级 AI fabric": "PCIe/CXL/Ethernet connectivity, rack-scale AI fabric",
      "全球高端光模块龙头": "Global high-end optical-module leader",
      "AI 云、电力、数据中心": "AI cloud, power, data centers",
      "光器件、光引擎、CPO 上游": "Optical devices, optical engines, CPO upstream",
      "AI 原生云、推理和训练集群": "AI-native cloud, inference and training clusters",
      "国产 AI 训练和推理芯片": "Domestic AI training and inference chips",
      "AI 服务器、AI 机柜、高速交换机": "AI servers, AI racks, high-speed switches",
      "高": "High",
      "中高": "Medium-high",
      "中": "Medium",
      "新易盛": "Eoptolink",
      "中际旭创": "Innolight",
      "天孚通信": "TFC Communication",
      "寒武纪": "Cambricon",
      "工业富联": "Foxconn Industrial Internet",
      "收入从高基数继续数倍增长，AI 工厂和云合同兑现，市场按 AI 云平台而非硬件租赁商估值。":
        "Revenue continues to compound from a higher base, AI factories and cloud contracts convert, and the market values it as an AI cloud platform rather than a hardware-rental company.",
      "Q1 2026 收入同比增长 684%，同时新增宾州 1.2GW 电力和土地；它是少数还有体量弹性的 AI 云纯度标的。":
        "Q1 2026 revenue grew 684% year on year, while the company added 1.2GW of Pennsylvania power and land; it is one of the few pure AI-cloud names with remaining scale elasticity.",
      "资本开支巨大、债务和应收账款压力高，若 GPU 云价格下行或融资窗口关闭，估值会被快速压缩。":
        "Capex, debt, and receivables pressure are high. If GPU cloud pricing falls or financing windows close, valuation can compress quickly.",
      "从 AEC 领先者扩成 AI 连接平台，ZeroFlap、ALC、OmniConnect 等新产品打开多条 TAM。":
        "Expands from an AEC leader into an AI connectivity platform, with ZeroFlap, ALC, OmniConnect, and other products opening multiple TAMs.",
      "FY2026 Q3 收入 4.07 亿美元，同比 +201.5%，毛利率接近 69%，已经从概念进入利润兑现。":
        "FY2026 Q3 revenue was $407M, up 201.5% year on year, with gross margin near 69%; the story has moved from concept to earnings delivery.",
      "客户集中、产品周期快，若光互联路线替代铜缆方案，或大客户降价，成长溢价会回落。":
        "Customer concentration and fast product cycles are risks. If optical interconnect routes replace copper solutions, or major customers demand price cuts, the growth premium can fade.",
      "AI 光模块从 800G 升级到 1.6T / 3.2T，海外客户和高端产品占比继续提升，利润率保持韧性。":
        "AI optical modules upgrade from 800G to 1.6T / 3.2T, overseas customers and high-end product mix keep rising, and margins remain resilient.",
      "2026Q1 营收同比 +105.76%，归母净利润同比 +76.80%，经营现金流同比 +243.71%，业绩质量好于多数概念股。":
        "1Q2026 revenue rose 105.76% year on year, net profit attributable to shareholders rose 76.80%, and operating cash flow rose 243.71%, giving it better earnings quality than most concept names.",
      "估值拥挤、汇兑损失和存货减值需要跟踪；若北美 AI 资本开支放缓，订单弹性也会反向放大。":
        "Valuation crowding, FX losses, and inventory impairments need monitoring; if North American AI capex slows, order elasticity can reverse sharply.",
      "Scorpio、Aries、Taurus、Leo 等产品从单点连接扩成 AI 机架平台，2027 年放量带来利润再加速。":
        "Scorpio, Aries, Taurus, Leo, and related products expand from point connectivity into an AI rack platform, with 2027 ramp potentially re-accelerating profits.",
      "Q1 2026 收入 3.084 亿美元，同比 +93%，非 GAAP 运营利润率 36.2%，且 Q2 指引继续顺序增长。":
        "Q1 2026 revenue was $308.4M, up 93% year on year, with 36.2% non-GAAP operating margin and continued sequential growth guided for Q2.",
      "估值通常提前反映增长，若 UALink/NVLink/PCIe 路线竞争使份额不稳，4x 难度上升。":
        "Valuation often prices growth early; if UALink/NVLink/PCIe route competition destabilizes share, the 4x hurdle rises.",
      "1.6T 高端产品持续放量，硅光/CPO 形成新利润曲线，全球份额维持领先。":
        "1.6T high-end products keep scaling, silicon photonics/CPO forms a new profit curve, and global share remains leading.",
      "2026Q1 营收 194.96 亿元，同比 +192.12%；净利润 57.35 亿元，同比 +262.28%，单季利润已极强。":
        "1Q2026 revenue was RMB 19.496B, up 192.12% year on year; net profit was RMB 5.735B, up 262.28%, already an extremely strong single quarter.",
      "过去一年涨幅巨大，继续 4x 需要全球 AI 光模块周期长期超预期；任何毛利率回落都会冲击估值。":
        "The stock has already risen sharply; another 4x needs the global AI optical-module cycle to keep beating expectations for years, and any margin retreat would pressure valuation.",
      "从比特币挖矿彻底切换成 AI 云，微软和英伟达合同兑现，市场给出可交付电力平台溢价。":
        "Fully pivots from Bitcoin mining into AI cloud, Microsoft and Nvidia contracts convert, and the market gives a premium to deliverable power platforms.",
      "2026 年 5 月披露 5 年 34 亿美元英伟达 AI 云合同，并拥有 5GW 全球数据中心管线。":
        "In May 2026 it disclosed a five-year $3.4B Nvidia AI cloud contract and a 5GW global data-center pipeline.",
      "转型期亏损、融资、执行和客户集中风险很高；它是弹性票，不是稳健票。":
        "Transition losses, financing, execution, and customer concentration risks are high; this is an elasticity trade, not a defensive holding.",
      "1.6T 光引擎和 CPO 配套器件规模化，成为光模块升级周期中的高毛利“铲子”。":
        "1.6T optical engines and CPO components scale up, making it a high-margin pick-and-shovel supplier in the optical-module upgrade cycle.",
      "2026Q1 营收同比 +40.82%、归母净利润同比 +45.79%，并推进海外产能和 H 股上市平台。":
        "1Q2026 revenue rose 40.82% year on year and net profit attributable to shareholders rose 45.79%, while the company advances overseas capacity and an H-share platform.",
      "不是直接光模块厂，成长依赖下游客户放量；市值已显著重估，后续需要更快利润增长消化。":
        "It is not a direct optical-module maker, so growth depends on downstream customer ramp; the market cap has already re-rated and now needs faster profit growth to digest it.",
      "近千亿美元 backlog 转化为高质量收入，并从训练扩张到企业推理、灵活容量和平台服务。":
        "Nearly $100B of backlog converts into high-quality revenue, while the business expands from training into enterprise inference, flexible capacity, and platform services.",
      "Q1 2026 披露收入 backlog 994 亿美元，是美国 AI 云需求最直接的上市映射之一。":
        "Q1 2026 disclosed $99.4B of revenue backlog, one of the most direct listed proxies for U.S. AI cloud demand.",
      "债务、折旧、客户集中和亏损压力大；若市场开始惩罚“高收入低自由现金流”，4x 会很难。":
        "Debt, depreciation, customer concentration, and losses are heavy; if the market starts penalizing high revenue with low free cash flow, 4x becomes difficult.",
      "国产算力需求持续替代，产品进入更多数据中心和行业应用，利润率证明可持续。":
        "Domestic compute substitution continues, products enter more data centers and industry applications, and margins prove sustainable.",
      "2026Q1 营收约 28.85 亿元，同比 +159.56%；归母净利润约 10.13 亿元，同比 +185.04%，经营现金流转正。":
        "1Q2026 revenue was about RMB 2.885B, up 159.56% year on year; net profit attributable to shareholders was about RMB 1.013B, up 185.04%, with operating cash flow turning positive.",
      "市值和预期已经很高，且库存跌价计提显示芯片迭代风险；4x 需要国产 AI 芯片份额极大提升。":
        "Market cap and expectations are already high, and inventory impairment shows chip-iteration risk; a 4x outcome needs a major increase in domestic AI chip share.",
      "AI 服务器从代工规模优势升级到高价值机柜、ASIC 服务器、CPO 交换机，利润率和估值同步上移。":
        "AI servers move from manufacturing scale advantage into high-value racks, ASIC servers, and CPO switches, lifting margins and valuation together.",
      "2026Q1 营收 2510.78 亿元，同比 +56.52%；归母净利润 105.95 亿元，同比 +102.55%，AI GPU 机柜出货高增。":
        "1Q2026 revenue was RMB 251.078B, up 56.52% year on year; net profit attributable to shareholders was RMB 10.595B, up 102.55%, with AI GPU rack shipments growing fast.",
      "体量太大，4x 需要长期利润率重估；若只是低毛利制造扩张，股价弹性会低于光模块和 AI 云。":
        "The company is large; a 4x outcome needs a long-term margin re-rating. If growth is just low-margin manufacturing expansion, stock elasticity will lag optical modules and AI cloud.",
      "最终推荐：用“核心 6 + 观察 4”跟踪，而不是一次性押注": "Final Recommendation: Track A Core 6 + Watch 4, Rather Than One Big Bet",
      "核心 6": "Core 6",
      "NBIS、CRDO、300502、ALAB、300308、IREN。它们的共同点是业务和 AI 资本开支直接相连，且已有财报或合同验证。":
        "NBIS, CRDO, 300502, ALAB, 300308, and IREN. Their common trait is direct linkage to AI capex, already backed by financial results or contracts.",
      "观察 4": "Watch 4",
      "300394、CRWV、688256、601138。它们同样重要，但当前存在市值过大、估值过满、亏损杠杆或兑现节奏不够清晰的问题。":
        "300394, CRWV, 688256, and 601138. They are also important, but currently have issues such as large market cap, full valuation, loss leverage, or less clear delivery cadence.",
      "调仓触发": "Rebalance Triggers",
      "下一轮财报若收入增速低于 35%、毛利率连续下滑、应收账款增速显著超过收入，或公司下修 AI 订单，应直接降级。":
        "Downgrade directly if the next earnings cycle shows revenue growth below 35%, sequential gross-margin decline, receivables growing much faster than revenue, or reduced AI orders.",
      "更稳的替代": "More Stable Alternatives",
      "若不追求 4x，可用 NVDA、AVGO、TSM、MSFT、GOOGL、腾讯、阿里作为低弹性 AI 核心仓，但它们不是本页的四倍优先目标。":
        "If you are not chasing 4x, NVDA, AVGO, TSM, MSFT, GOOGL, Tencent, and Alibaba can serve as lower-elasticity AI core holdings, but they are not this page's priority 4x targets.",
      "未来五年跟踪清单": "Five-Year Tracking Checklist",
      "美股 AI 云：每季检查合同 backlog、GPU 利用率、应收账款、债务到期和资本开支融资成本。":
        "U.S. AI cloud: each quarter, check contract backlog, GPU utilization, receivables, debt maturities, and capex financing cost.",
      "高速互联：检查 800G 到 1.6T / 3.2T 的产品切换是否提高毛利率，而不是只带来库存和降价压力。":
        "High-speed interconnect: check whether the 800G to 1.6T / 3.2T transition lifts gross margin rather than only creating inventory and price-cut pressure.",
      "中国光模块：检查海外大客户占比、泰国/海外产能、汇率影响、CPO 量产节奏和存货跌价。":
        "China optical modules: check overseas key-customer share, Thailand/overseas capacity, FX impact, CPO ramp cadence, and inventory write-downs.",
      "国产 AI 芯片：检查收入是否来自真实批量部署，而不是一次性项目；同时盯库存、研发投入和生态兼容性。":
        "Domestic AI chips: check whether revenue comes from real batch deployment rather than one-off projects, while monitoring inventory, R&D spend, and ecosystem compatibility.",
      "估值纪律：若股价先涨 2x 但利润没有同步翻倍，应把“4x 候选”降为“兑现观察”。":
        "Valuation discipline: if the stock rises 2x before profit doubles, downgrade it from 4x candidate to delivery watch.",
      "本页使用的公开资料": "Public Sources Used"
      ,
      "用于判断美国 AI 交易的宏观主线：云厂商大规模资本开支和投资者对回报的审视。":
        "Used to frame the U.S. AI trade: hyperscaler capex and investor scrutiny of returns.",
      "公司披露 Q1 2026 收入、EBITDA、电力和 AI factory 进展。":
        "Company disclosure for Q1 2026 revenue, EBITDA, power, and AI factory progress.",
      "用于核验收入增长、毛利率、产品扩张和下一季度收入指引。":
        "Used to verify revenue growth, gross margin, product expansion, and next-quarter guidance.",
      "用于核验收入、利润率、Scorpio X-Series 和 PCIe 6 / UALink 相关进展。":
        "Used to verify revenue, margin, Scorpio X-Series, and PCIe 6 / UALink progress.",
      "用于核验 AI 云 backlog、推理产品和容量计划。":
        "Used to verify AI cloud backlog, inference products, and capacity plans.",
      "用于核验英伟达合同、5GW 管线和从挖矿向 AI 云转型的财务状态。":
        "Used to verify Nvidia contracts, the 5GW pipeline, and the financial state of the shift from mining to AI cloud.",
      "新易盛 2026 年第一季度报告": "Eoptolink 2026 First-Quarter Report",
      "公司公告原文，用于核验营收、利润和现金流。":
        "Company filing used to verify revenue, profit, and cash flow.",
      "证券时报：中际旭创 2026Q1 业绩": "Securities Times: Innolight 1Q2026 results",
      "用于核验中际旭创收入、净利润和 AI 算力基础设施需求表述。":
        "Used to verify Innolight revenue, net profit, and AI compute-infrastructure demand commentary.",
      "证券时报：天孚通信 2026Q1 业绩": "Securities Times: TFC Communication 1Q2026 results",
      "用于核验天孚通信收入、利润、光器件定位和 1.6T / CPO 进展。":
        "Used to verify TFC Communication revenue, profit, optical-device positioning, and 1.6T / CPO progress.",
      "每日经济新闻：寒武纪 2026Q1 业绩": "National Business Daily: Cambricon 1Q2026 results",
      "用于核验寒武纪营收、利润、现金流和存货跌价风险。":
        "Used to verify Cambricon revenue, profit, cash flow, and inventory write-down risk.",
      "新浪财经：工业富联 2026Q1 业绩解读": "Sina Finance: Foxconn Industrial Internet 1Q2026 results review",
      "用于核验工业富联 AI 服务器、AI GPU 机柜和高速交换机出货进展。":
        "Used to verify Foxconn Industrial Internet AI server, AI GPU rack, and high-speed switch shipment progress."
    })
  );

  const zhToEn = new Map();
  exactTranslations.forEach((zh, en) => {
    if (!zhToEn.has(zh)) zhToEn.set(zh, en);
  });
  chineseSourceTranslations.forEach((en, zh) => {
    zhToEn.set(zh, en);
  });

  const originalText = new WeakMap();
  const originalAttrs = new WeakMap();
  let currentLanguage = normalizeLanguage(readStoredLanguage() || "en");
  let isApplying = false;
  let observer = null;
  let observerScheduled = false;
  const pendingRoots = new Set();
  const observerOptions = {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["placeholder", "title", "aria-label"]
  };

  function normalizeLanguage(language) {
    return LANGUAGES.includes(language) ? language : "en";
  }

  function readStoredLanguage() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (_) {
      return null;
    }
  }

  function writeStoredLanguage(language) {
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch (_) {
      // Language switching should still work for the current page when storage is unavailable.
    }
  }

  function translateFromEnglish(text) {
    if (/[\u3400-\u9fff]/.test(text)) return text;

    const exact = exactTranslations.get(text);
    if (exact) return exact;

    let translated = text;
    phraseTranslations.forEach(([source, target]) => {
      translated = translated.split(source).join(target);
    });

    translated = translated.replace(/^(\d+)\s+个结果$/, "$1 个结果");
    translated = translated.replace(/^(\d+)\s+results$/, "$1 个结果");
    translated = translated.replace(/^(\d+)\s+school signals$/, "$1 个学校信号");
    translated = translated.replace(/^(\d+)\s+HDB matches$/, "$1 个 HDB 匹配");
    translated = translated.replace(/^(\d+)\s+likely private$/, "$1 个疑似私宅");
    translated = translated.replace(/^(\d+)\s+place records$/, "$1 个地点记录");
    translated = translated.replace(/^(\d+)\s+records$/, "$1 条记录");
    translated = translated.replace(/^Phase\s+(.+)$/, "阶段 $1");
    translated = translated.replace(/^PSLE Rank #(.+)$/, "PSLE 排名 #$1");
    translated = translated.replace(/^Score\s+(.+)$/, "评分 $1");
    translated = translated.replace(/^Case\s+(.+)$/, "案例 $1");
    translated = translated.replace(/^Base 5y$/, "5 年基准");
    translated = translated.replace(/^Bull 5y$/, "5 年牛市");
    translated = translated.replace(/^S\$\s*([\d,]+)\s*psf$/, "S$ $1 / 平方英尺");
    translated = translated.replace(/^(\d+) sqft$/, "$1 平方英尺");
    translated = translated.replace(/^(\d+) sqm$/, "$1 平方米");
    translated = translated.replace(/^(\d+) years$/, "$1 年");
    translated = translated.replace(/^(\d+)y$/, "$1 年");
    translated = translated.replace(/^(\d+) m$/, "$1 米");

    return translated;
  }

  function translateText(text) {
    const trimmed = text.replace(/\s+/g, " ").trim();
    if (!trimmed) return text;

    const leading = text.match(/^\s*/)?.[0] || "";
    const trailing = text.match(/\s*$/)?.[0] || "";

    if (currentLanguage === "zh") {
      return `${leading}${translateFromEnglish(trimmed)}${trailing}`;
    }

    return `${leading}${zhToEn.get(trimmed) || trimmed}${trailing}`;
  }

  function shouldSkipElement(element) {
    if (!element) return false;
    return Boolean(element.closest("script, style, noscript, code, pre, [data-i18n-skip]"));
  }

  function applyTextNode(node) {
    if (shouldSkipElement(node.parentElement)) return;
    if (!originalText.has(node)) originalText.set(node, node.nodeValue);
    const next = translateText(originalText.get(node));
    if (node.nodeValue !== next) node.nodeValue = next;
  }

  function applyAttributes(element) {
    if (shouldSkipElement(element)) return;
    const attrs = ["placeholder", "title", "aria-label"];
    attrs.forEach((attr) => {
      if (!element.hasAttribute(attr)) return;
      let stored = originalAttrs.get(element);
      if (!stored) {
        stored = {};
        originalAttrs.set(element, stored);
      }
      if (!stored[attr]) stored[attr] = element.getAttribute(attr);
      const next = translateText(stored[attr]);
      if (element.getAttribute(attr) !== next) element.setAttribute(attr, next);
    });
  }

  function applyI18n(root = document.body) {
    if (!root) return;
    if (!root.isConnected && root.nodeType !== Node.DOCUMENT_NODE) return;

    const wasObserving = Boolean(observer);
    if (wasObserving) observer.disconnect();
    isApplying = true;

    try {
      document.documentElement.lang = currentLanguage === "zh" ? "zh-CN" : "en";
      if (!document.documentElement.dataset.originalTitle) {
        document.documentElement.dataset.originalTitle = document.title;
      }
      document.title = translateText(document.documentElement.dataset.originalTitle);

      if (root.nodeType === Node.TEXT_NODE) {
        applyTextNode(root);
      } else if (root.nodeType === Node.ELEMENT_NODE || root.nodeType === Node.DOCUMENT_NODE) {
        if (root.nodeType === Node.ELEMENT_NODE) applyAttributes(root);
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
        let node = walker.nextNode();
        while (node) {
          if (node.nodeType === Node.TEXT_NODE) applyTextNode(node);
          if (node.nodeType === Node.ELEMENT_NODE) applyAttributes(node);
          node = walker.nextNode();
        }
      }

      updateToggle();
    } finally {
      isApplying = false;
      if (wasObserving) observer.observe(document.body, observerOptions);
    }
  }

  function setLanguage(language) {
    currentLanguage = normalizeLanguage(language);
    writeStoredLanguage(currentLanguage);
    applyI18n(document.body);
    window.dispatchEvent(new CustomEvent("i18n:change", { detail: { language: currentLanguage } }));
  }

  function updateToggle() {
    const toggle = document.getElementById("languageToggle");
    if (!toggle) return;
    const label = currentLanguage === "zh" ? "EN" : "中文";
    const description = currentLanguage === "zh" ? "Switch to English" : "切换到中文";
    if (toggle.textContent !== label) toggle.textContent = label;
    if (toggle.getAttribute("aria-label") !== description) toggle.setAttribute("aria-label", description);
    if (toggle.title !== description) toggle.title = description;
  }

  function installToggle() {
    if (document.getElementById("languageToggle")) return;
    const button = document.createElement("button");
    button.id = "languageToggle";
    button.className = "language-toggle";
    button.type = "button";
    button.addEventListener("click", () => {
      setLanguage(currentLanguage === "zh" ? "en" : "zh");
    });
    document.body.appendChild(button);
    updateToggle();
  }

  function observeChanges() {
    observer = new MutationObserver((mutations) => {
      if (isApplying) return;
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => pendingRoots.add(node));
        if (mutation.type === "characterData") pendingRoots.add(mutation.target);
        if (mutation.type === "attributes") pendingRoots.add(mutation.target);
      });

      if (observerScheduled || !pendingRoots.size) return;
      observerScheduled = true;
      const run = () => {
        observerScheduled = false;
        const roots = Array.from(pendingRoots);
        pendingRoots.clear();
        roots.forEach((root) => applyI18n(root));
      };
      if (window.requestAnimationFrame) {
        window.requestAnimationFrame(run);
      } else {
        window.setTimeout(run, 0);
      }
    });
    observer.observe(document.body, observerOptions);
  }

  window.I18N = {
    get language() {
      return currentLanguage;
    },
    setLanguage,
    t: translateText,
    apply: applyI18n
  };

  document.addEventListener("DOMContentLoaded", () => {
    installToggle();
    applyI18n(document.body);
    observeChanges();
  });
})();
