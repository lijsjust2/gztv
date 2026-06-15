// 频道列表
//
// 频道类型：
// 1. GDTV频道（有pk字段）：通过 gdtv-api 动态获取带token的直播流地址
// 2. 静态频道（有url字段）：直接使用固定的 m3u8 地址

const channels = [
  // === 央视频道（静态源） ===
  { id: 'cctv1',  name: 'CCTV1综合',     group: '央视', logo: 'https://upload.wikimedia.org/wikipedia/zh/thumb/6/65/CCTV-1_Logo.svg/200px-CCTV-1_Logo.svg.png', url: 'http://120.211.62.180:8000/hls/1/index.m3u8' },
  { id: 'cctv2',  name: 'CCTV2财经',     group: '央视', logo: 'https://upload.wikimedia.org/wikipedia/zh/thumb/b/b2/CCTV-2_Logo.svg/200px-CCTV-2_Logo.svg.png', url: 'http://120.211.62.180:8000/hls/2/index.m3u8' },
  { id: 'cctv3',  name: 'CCTV3综艺',     group: '央视', logo: 'https://upload.wikimedia.org/wikipedia/zh/thumb/3/3e/CCTV-3_Logo.svg/200px-CCTV-3_Logo.svg.png', url: 'http://120.211.62.180:8000/hls/3/index.m3u8' },
  { id: 'cctv4',  name: 'CCTV4中文国际', group: '央视', logo: 'https://upload.wikimedia.org/wikipedia/zh/thumb/1/1b/CCTV-4_Logo.svg/200px-CCTV-4_Logo.svg.png', url: 'http://120.211.62.180:8000/hls/4/index.m3u8' },
  { id: 'cctv5',  name: 'CCTV5体育',     group: '央视', logo: 'https://upload.wikimedia.org/wikipedia/zh/thumb/9/9c/CCTV-5_Logo.svg/200px-CCTV-5_Logo.svg.png', url: 'http://120.211.62.180:8000/hls/503/index.m3u8' },
  { id: 'cctv5p', name: 'CCTV5+体育赛事', group: '央视', logo: 'https://upload.wikimedia.org/wikipedia/zh/thumb/5/58/CCTV-5%2B_Logo.svg/200px-CCTV-5%2B_Logo.svg.png', url: 'http://120.211.62.180:8000/hls/18/index.m3u8' },
  { id: 'cctv6',  name: 'CCTV6电影',     group: '央视', logo: 'https://upload.wikimedia.org/wikipedia/zh/thumb/9/9a/CCTV-6_Logo.svg/200px-CCTV-6_Logo.svg.png', url: 'http://120.211.62.180:8000/hls/6/index.m3u8' },
  { id: 'cctv7',  name: 'CCTV7国防军事', group: '央视', logo: 'https://upload.wikimedia.org/wikipedia/zh/thumb/7/71/CCTV-7_Logo.svg/200px-CCTV-7_Logo.svg.png', url: 'http://120.211.62.180:8000/hls/7/index.m3u8' },
  { id: 'cctv8',  name: 'CCTV8电视剧',   group: '央视', logo: 'https://upload.wikimedia.org/wikipedia/zh/thumb/d/d8/CCTV-8_Logo.svg/200px-CCTV-8_Logo.svg.png', url: 'http://120.211.62.180:8000/hls/8/index.m3u8' },
  { id: 'cctv9',  name: 'CCTV9纪录',     group: '央视', logo: 'https://upload.wikimedia.org/wikipedia/zh/thumb/c/c7/CCTV-9_Logo.svg/200px-CCTV-9_Logo.svg.png', url: 'http://120.211.62.180:8000/hls/9/index.m3u8' },
  { id: 'cctv10', name: 'CCTV10科教',    group: '央视', logo: 'https://upload.wikimedia.org/wikipedia/zh/thumb/4/4c/CCTV-10_Logo.svg/200px-CCTV-10_Logo.svg.png', url: 'http://120.211.62.180:8000/hls/10/index.m3u8' },
  { id: 'cctv11', name: 'CCTV11戏曲',    group: '央视', logo: 'https://upload.wikimedia.org/wikipedia/zh/thumb/a/a3/CCTV-11_Logo.svg/200px-CCTV-11_Logo.svg.png', url: 'http://120.211.62.180:8000/hls/11/index.m3u8' },
  { id: 'cctv12', name: 'CCTV12社会与法', group: '央视', logo: 'https://upload.wikimedia.org/wikipedia/zh/thumb/e/ef/CCTV-12_Logo.svg/200px-CCTV-12_Logo.svg.png', url: 'http://120.211.62.180:8000/hls/12/index.m3u8' },
  { id: 'cctv13', name: 'CCTV13新闻',    group: '央视', logo: 'https://upload.wikimedia.org/wikipedia/zh/thumb/2/28/CCTV-13_Logo.svg/200px-CCTV-13_Logo.svg.png', url: 'http://120.211.62.180:8000/hls/13/index.m3u8' },
  { id: 'cctv14', name: 'CCTV14少儿',    group: '央视', logo: 'https://upload.wikimedia.org/wikipedia/zh/thumb/8/87/CCTV-14_Logo.svg/200px-CCTV-14_Logo.svg.png', url: 'http://120.211.62.180:8000/hls/14/index.m3u8' },
  { id: 'cctv15', name: 'CCTV15音乐',    group: '央视', logo: 'https://upload.wikimedia.org/wikipedia/zh/thumb/e/e3/CCTV-15_Logo.svg/200px-CCTV-15_Logo.svg.png', url: 'http://120.211.62.180:8000/hls/15/index.m3u8' },
  { id: 'cctv16', name: 'CCTV16奥林匹克', group: '央视', logo: 'https://upload.wikimedia.org/wikipedia/zh/thumb/1/11/CCTV-16_Logo.svg/200px-CCTV-16_Logo.svg.png', url: 'http://183.11.239.36:808/hls/169/index.m3u8' },
  { id: 'cctv17', name: 'CCTV17农业农村', group: '央视', logo: 'https://upload.wikimedia.org/wikipedia/zh/thumb/8/84/CCTV-17_Logo.svg/200px-CCTV-17_Logo.svg.png', url: 'http://120.211.62.180:8000/hls/17/index.m3u8' },

  // === 广东频道（GDTV） ===
  { id: 'gdws',   name: '广东卫视',           pk: 43, group: '广东频道', logo: 'https://img.gdtv.cn/image/202212/0.922000490569147761fbecf64d4705c1fOSS1670410666.png' },
  { id: 'gdzj',   name: '广东珠江',           pk: 44, group: '广东频道', logo: 'https://img.gdtv.cn/image/202010/0.267579252589195161fbecf64d4705c1fOSS1603767828.png' },
  { id: 'gdxw',   name: '广东新闻',           pk: 45, group: '广东频道', logo: 'https://img.gdtv.cn/image/202010/0.2667524506857079681fbecf64d4705c1fOSS1603767886.png' },
  { id: 'gdms',   name: '广东民生',           pk: 48, group: '广东频道', logo: 'https://img.gdtv.cn/image/202010/0.5965555343297448101fbecf64d4705c1fOSS1603767991.png' },
  { id: 'gdty',   name: '广东体育',           pk: 47, group: '广东频道', logo: 'https://img.gdtv.cn/image/202010/0.20912682116751147121fbecf64d4705c1fOSS1603768039.png' },
  { id: 'dwqws',  name: '大湾区卫视',         pk: 51, group: '广东频道', logo: 'https://img.gdtv.cn/image/202212/0.04559548741050467651fbecf64d4705c1fOSS1670410624.png' },
  { id: 'dwqwhw', name: '大湾区卫视（海外版）', pk: 46, group: '广东频道', logo: 'https://img.gdtv.cn/image/202010/0.23111170517279023101fbecf64d4705c1fOSS1603782647.png' },
  { id: 'gdys',   name: '广东影视',           pk: 53, group: '广东频道', logo: 'https://img.gdtv.cn/image/202010/0.0446282923007013161fbecf64d4705c1fOSS1603782530.png' },
  { id: '4k',     name: '4K超高清',           pk: 16, group: '广东频道', logo: 'https://img.gdtv.cn/image/202010/0.80278120101302281fbecf64d4705c1fOSS1603782584.png' },
  { id: 'gdse',   name: '广东少儿',           pk: 54, group: '广东频道', logo: 'https://img.gdtv.cn/image/202010/0.30337141509040366121fbecf64d4705c1fOSS1603782684.png' },
  { id: 'jjkt',   name: '嘉佳卡通',           pk: 66, group: '广东频道', logo: 'https://img.gdtv.cn/image/202010/0.6444330962711713141fbecf64d4705c1fOSS1603782736.png' },
  { id: 'nfgo',   name: '南方购物',           pk: 42, group: '广东频道', logo: 'https://img.gdtv.cn/image/202006/0.102422542692707452328338108b1d6285eOSS1592469891.png' },
  { id: 'lqxq',   name: '岭南戏曲',           pk: 15, group: '广东频道', logo: 'https://img.gdtv.cn/image/202006/0.016213818872562682428338108b1d6285eOSS1592469914.png' },
  { id: 'gdyd',   name: '广东移动',           pk: 74, group: '广东频道', logo: 'https://img.gdtv.cn/image/202006/0.54017749556451132828338108b1d6285eOSS1592469988.png' },
  { id: 'gdjdj',  name: '广东台经典剧',       pk: 100, group: '广东频道', logo: 'https://img.gdtv.cn/image/202202/0.30697027433555623604a2079f14175dOSS1645519639.jpg' },
  { id: 'jlp',    name: '纪录片',             pk: 94, group: '广东频道', logo: 'https://img.gdtv.cn/image/202206/0.822271795481626523604a2079f14175dOSS1655194280.jpg' },
  { id: 'jk',     name: '健康',               pk: 99, group: '广东频道', logo: 'https://img.gdtv.cn/image/202202/0.178045607722976174b9f2d3e76e358bedOSS1645085153.png' },
  { id: 'grtsh',  name: 'GRTN生活频道',       pk: 102, group: '广东频道', logo: 'https://img.gdtv.cn/image/202306/0.40100312163621733ab4bc4aafc8ea28dOSS1685585906.png' },
]

// 根据频道ID查找频道
function getChannelById(id) {
  return channels.find(ch => ch.id === id)
}

// 根据pk查找频道
function getChannelByPk(pk) {
  return channels.find(ch => ch.pk === pk)
}

// 按分组获取频道
function getChannelsByGroup(group) {
  return channels.filter(ch => ch.group === group)
}

// 获取所有分组
function getGroups() {
  var groupSet = new Set(channels.map(ch => ch.group))
  return [...groupSet]
}

export { channels, getChannelById, getChannelByPk, getChannelsByGroup, getGroups }