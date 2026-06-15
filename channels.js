// 荔枝网(GDTV) 频道列表
//
// 数据来源：gdtv.cn 官方网站频道列表
// 播放原理：通过 gdtv-api 动态获取带token的直播流地址，实现固定接口访问
// 频道pk对应关系：通过 https://www.gdtv.cn/tvChannelDetail/{pk} 页面可查看

const channels = [
  // === 广东频道 ===
  { id: 'gdws',   name: '广东卫视',           pk: 43, group: '广东频道', logo: 'https://img.gdtv.cn/image/202212/0.922000490569147761fbecf64d4705c1fOSS1670410666.png' },
  { id: 'gdzj',   name: '广东珠江',           pk: 44, group: '广东频道', logo: '' },
  { id: 'gdxw',   name: '广东新闻',           pk: 45, group: '广东频道', logo: '' },
  { id: 'gdms',   name: '广东民生',           pk: 48, group: '广东频道', logo: '' },
  { id: 'gdty',   name: '广东体育',           pk: 47, group: '广东频道', logo: '' },
  { id: 'dwqws',  name: '大湾区卫视',         pk: 51, group: '广东频道', logo: '' },
  { id: 'dwqwhw', name: '大湾区卫视（海外版）', pk: 46, group: '广东频道', logo: '' },
  { id: 'gdys',   name: '广东影视',           pk: 53, group: '广东频道', logo: '' },
  { id: '4k',     name: '4K超高清',           pk: 16, group: '广东频道', logo: '' },
  { id: 'gdse',   name: '广东少儿',           pk: 54, group: '广东频道', logo: '' },
  { id: 'jjkt',   name: '嘉佳卡通',           pk: 66, group: '广东频道', logo: '' },
  { id: 'nfgo',   name: '南方购物',           pk: 42, group: '广东频道', logo: '' },
  { id: 'lqxq',   name: '岭南戏曲',           pk: 15, group: '广东频道', logo: '' },
  { id: 'gdyd',   name: '广东移动',           pk: 74, group: '广东频道', logo: '' },
  { id: 'gdjdj',  name: '广东台经典剧',       pk: 100, group: '广东频道', logo: '' },
  { id: 'jlp',    name: '纪录片',             pk: 94, group: '广东频道', logo: '' },
  { id: 'jk',     name: '健康',               pk: 99, group: '广东频道', logo: '' },
  { id: 'grtsh',  name: 'GRTN生活频道',       pk: 102, group: '广东频道', logo: '' },
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
