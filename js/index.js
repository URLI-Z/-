/*
 * @Author: Tom.zhang
 * @Date: 2021-08-05 22:53:16
 * @LastEditors: Tom.zhang
 * @LastEditTime: 2021-08-06 22:19:53
 * @Descripttion: 
 */
const {
	ref,
	reactive,
	onMounted
} = Vue;
const Star = {
	setup() {
		const pageLayout = reactive([])
		const choiceArr = reactive([])
		let timer = ref(null)
		let source = ref(0)
		let targetSource = ref(2500)
		let level = ref(0)
		let sourceElement = ref(null)

		// 初始化星星数组
		// 0红色草坪 1黄色障碍物 4紫色起始点 3绿色路径
		const initStarts = () => {
			// 初始化星星数组
			pageLayout.splice(0, 100)
			for (let i = 0; i < 10; i++) {
				for (let j = 0; j < 10; j++) {
					let tempRandom = getRamdom(5)
					pageLayout.push({
						id: i + '' + j,
						imgType: tempRandom, //特征值
						imgPath: `./img/${tempRandom}.png` ,
						x: i, // 坐标X
						y: j, // 坐标Y
					})
				}
			}
			// 体验消灭星星时不要设置随机打乱
			// reSortStarts()
		}

		// 获取一个范围内的随机数
		const getRamdom = (len) => {
			let length = len || pageLayout.length
			return Math.floor(Math.random() * length)
		}

		// 删除星星
		const removeStar = (list, targetList) => {
			list.forEach((val) => {
				let index = targetList.findIndex((item) => {
					return item.id === val.id
				})
				index > -1 && targetList.splice(index, 1)
			})

		}

		// 将星星数组内的星星进行随机打乱
		const reSortStarts = () => {
			for (let index = 0; index < pageLayout.length; index++) {
				let result = changeTwoStarPosition(pageLayout.splice(getRamdom(), 1)[0], pageLayout.splice(
					getRamdom(), 1)[0])
				pageLayout.splice(getRamdom(), 0, result[0], result[1])
			}
		}

		// 交换两个星星的位置
		const changeTwoStarPosition = (star1, star2) => {
			let a = star1.x,
				b = star1.y
			star1.x = star2.x
			star1.y = star2.y
			star2.x = a
			star2.y = b
			return [star1, star2]
		}

		// 判断数组中是否有某个元素 ，有的话，直接返回在当前数组中对应的对象。否则返回undefined
		const existInList = (element, list) => {
			let result = list.find((item) => {
				return item.id === element.id
			})
			return result
		}

		// 通过下标来获取对应的对象 point={x,y} 找到就返回该对象，否则返回false
		const getElementByPoint = (point) => {
			let index = pageLayout.findIndex((item) => {
				return item.x === point.x && item.y === point.y
			})
			if (index > -1) return pageLayout[index]
			return false
		}

		// 获取周围的个点,返回一个对象列表
		const getSurroundElements = (currentElement) => {
			let {
				x,
				y
			} = currentElement

			// 找八个点（可以斜着走）
			// let tempPoints = [
			//     { x: x - 1, y: y - 1 },
			//     { x: x, y: y - 1 },
			//     { x: x + 1, y: y - 1 },
			//     { x: x + 1, y: y },
			//     { x: x + 1, y: y + 1 },
			//     { x: x, y: y + 1 },
			//     { x: x - 1, y: y + 1 },
			//     { x: x - 1, y: y }
			// ]

			// 找四个点（上下左右）
			let tempPoints = [{
					x: x,
					y: y - 1
				},
				{
					x: x + 1,
					y: y
				},
				{
					x: x,
					y: y + 1
				},
				{
					x: x - 1,
					y: y
				}
			]
			let tempResult = []
			tempPoints.forEach((item) => {
				let element = getElementByPoint(item)
				element !== false && tempResult.push(element)
			})
			return tempResult
		}


		// 星星点击事件
		const startClick = (item) => {
			// 寻找周围同色星星
			let findResultList = findTheSameStars(item)
			// 更新分数
			updateSource((Math.pow(findResultList.length, 2) * 5))
			// 删除星星
			removeStar(findResultList, pageLayout)
			// 检测游戏结果
			setTimeout(() => {
				checkGameResult()
			}, 500)
			refreshPageLayout()
		}

		// 更新分数
		const updateSource = (tempSource) => {
			// source.value += tempSource
			new CountUp(sourceElement.value, source.value, source.value += tempSource).start()
		}

		// 找周围相同的星星(找到的同色相邻星星小于2，则返回一个空数组)
		const findTheSameStars = (element) => {
			let openList = [], // 待遍历数组
				closeList = [] // 已遍历数组

			// 获得相邻的同色星星
			openList.push(element)
			do {
				let currentElement = openList.pop()

				closeList.push(currentElement)

				let surroundElements = getSurroundElements(currentElement)

				surroundElements.map((item) => {
					// 没有被遍历的
					if (!existInList(item, closeList)) {
						// 是否是待遍历的星星
						let result = existInList(item, openList)
						if (!result && item.imgType === currentElement.imgType) {
							openList.push(item);
						}
					}
				})
				//如果开启列表空了，没有通路，结果为空
				if (openList.length == 0) {
					break;
				}
			} while (true);

			// 至少两个及以上相连的同色星星才能进行消除
			if (closeList.length < 2) return []

			return closeList

		}

		// 查找X轴上某一列的长度（y的长度），返回长度值
		const findSomeClosLength = (cloIndex) => {
			let length = []
			pageLayout.map((item) => {
				if (item.x === cloIndex) {
					length++
				}
			})
			return length
		}

		// 查找X轴上还有几列，返回列数
		const findXLength = () => {
			let count = 0
			for (let i = 0; i < 10; i++) {
				let result = pageLayout.filter((item) => {
					return item.x === i
				})
				if (result.length !== 0) {
					count++
				}
			}
			return count
		}

		// 消灭星星后，整理页面星星
		const refreshPageLayout = () => {
			// 整理每一列，使该列上的星星下移，替补空缺位置
			for (let i = 0; i < 10; i++) {
				// 获得某一列的长度
				let length = findSomeClosLength(i)
				// 该列中的位置
				let index = 0
				// 遍历该列，使该列中的星星按照长度顺序设置Y轴坐标
				pageLayout.map((item) => {
					if (item.x === i && index < length) {
						item.y = index
						index++
					}
				})
			}
			// 整理每一列，如果某一列星星的前一列全部被消完，则此列往前补
			// 获取当前存在几列
			let xLength = findXLength()
			// X轴总列数中的第几列
			let tempIndex = 0
			for (let i = 0; i < 10; i++) {
				// 获取每一列的星星
				let result = pageLayout.filter((item) => {
					return item.x === i
				})
				// 该列存在星星，使该列星星的X轴坐标变成X轴总列数中的第几列的坐标
				if (result.length > 0 && tempIndex < xLength) {
					result.map(item => {
						item.x = tempIndex
					})
					// 累加器+1
					tempIndex++
				}
			}
		}

		// 判断游戏输赢
		const checkGameResult = () => {
			if (source.value >= targetSource.value) {
				clearInterval(timer.value)
				let result = window.confirm('闯关成功，是否开始下一关？', )
				result === true ? initGame(0) : initGame(1)
				return
			}
			let result = pageLayout.some(item => {
				return findTheSameStars(item).length > 0
			})
			if (result === false) {
				clearInterval(timer.value)
				let result = window.confirm('游戏失败，是否重新开始？', )
				result === true ? initGame(1) : initGame(1)
				return
			}
		}

		// 初始化游戏 condition传入0表示进入下一关，传入1表示从第一关开始
		const initGame = (condition) => {
			initStarts()
			source.value = 0
			new CountUp(sourceElement.value, source.value, source.value).start()
			condition ? (level.value = 1) : (level.value++)
			targetSource.value = level.value * 500
		}

		// 自动消灭星星
		const autoPlay = () => {
			let tempPageLayout = JSON.parse(JSON.stringify(pageLayout))
			let containerList = []
			tempPageLayout.forEach((item) => {
				let tempResult = findTheSameStars(item)
				containerList.push(tempResult)
				removeStar(tempResult, tempPageLayout)
			})
			containerList.sort((a, b) => {
				return b.length - a.length
			})
			startClick(containerList[0][0])
		}

		// 停止自动化
		const stopAutoPlay = () => {
			if (timer.value) {
				vant.Toast('已停止自动运行');
				clearInterval(timer.value)
			}
		}

		// 电脑自动玩
		const computer = () => {
			vant.Toast('开始自动运行');
			timer.value = setInterval(() => {
				autoPlay()
			}, 700);
		}


		// 初始化
		onMounted(() => {
			initGame()
		})

		return {
			choiceArr,
			pageLayout,
			source,
			targetSource,
			level,
			sourceElement,
			initStarts,
			startClick,
			removeStar,
			reSortStarts,
			findTheSameStars,
			autoPlay,
			stopAutoPlay,
			computer
		}
	}
}

const app = Vue.createApp(Star)
app.use(vant)
app.mount('#app')
