"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const plugin_1 = __importStar(require("../../plugin"));
class SendGift extends plugin_1.default {
    constructor() {
        super();
        this.name = '自动送礼';
        this.description = '在指定房间送出剩余时间不足24小时的礼物';
        this.version = '0.0.1';
        this.author = 'lzghzr';
    }
    async load({ defaultOptions, whiteList }) {
        defaultOptions.newUserData['sendGift'] = false;
        defaultOptions.info['sendGift'] = {
            description: '自动送礼',
            tip: '自动送出剩余时间不足24小时的礼物',
            type: 'boolean'
        };
        whiteList.add('sendGift');
        defaultOptions.newUserData['sendGiftRoom'] = 0;
        defaultOptions.info['sendGiftRoom'] = {
            description: '自动送礼房间',
            tip: '要自动送出礼物的房间号',
            type: 'number'
        };
        whiteList.add('sendGiftRoom');
        this.loaded = true;
    }
    async start({ users }) {
        this._sendGift(users);
    }
    async loop({ cstMin, cstHour, cstString, users }) {
        if (cstMin === 30 && cstHour % 8 === 4 || cstString === '13:55')
            this._sendGift(users);
    }
    _sendGift(users) {
        users.forEach(async (user) => {
            if (!user.userData['sendGift'] || user.userData['sendGiftRoom'] === 0)
                return;
            const roomID = user.userData.sendGiftRoom;
            const room = {
                uri: `https://api.live.bilibili.com/room/v1/Room/mobileRoomInit?id=${roomID}}`,
                json: true
            };
            const roomInit = await plugin_1.tools.XHR(room, 'Android');
            if (roomInit !== undefined && roomInit.response.statusCode === 200) {
                if (roomInit.body.code === 0) {
                    const mid = roomInit.body.data.uid;
                    const room_id = roomInit.body.data.room_id;
                    const bag = {
                        uri: `https://api.live.bilibili.com/gift/v2/gift/m_bag_list?${plugin_1.AppClient.signQueryBase(user.tokenQuery)}`,
                        json: true,
                        headers: user.headers
                    };
                    const bagInfo = await plugin_1.tools.XHR(bag, 'Android');
                    if (bagInfo !== undefined && bagInfo.response.statusCode === 200) {
                        if (bagInfo.body.code === 0) {
                            if (bagInfo.body.data.length > 0) {
                                for (const giftData of bagInfo.body.data) {
                                    if (giftData.expireat > 0 && giftData.expireat < 24 * 60 * 60) {
                                        const send = {
                                            method: 'POST',
                                            uri: `https://api.live.bilibili.com/gift/v2/live/bag_send?${plugin_1.AppClient.signQueryBase(user.tokenQuery)}`,
                                            body: `uid=${giftData.uid}&ruid=${mid}&gift_id=${giftData.gift_id}&gift_num=${giftData.gift_num}\
&bag_id=${giftData.id}&biz_id=${room_id}&rnd=${plugin_1.AppClient.RND}&biz_code=live&jumpFrom=21002`,
                                            json: true,
                                            headers: user.headers
                                        };
                                        const sendBag = await plugin_1.tools.XHR(send, 'Android');
                                        if (sendBag !== undefined && sendBag.response.statusCode === 200) {
                                            if (sendBag.body.code === 0) {
                                                const sendBagData = sendBag.body.data;
                                                plugin_1.tools.Log(user.nickname, '自动送礼', `向房间 ${roomID} 赠送 ${sendBagData.gift_num} 个${sendBagData.gift_name}`);
                                            }
                                            else
                                                plugin_1.tools.Log(user.nickname, '自动送礼', sendBag.body);
                                        }
                                        else
                                            plugin_1.tools.Log(user.nickname, '自动送礼', '网络错误');
                                        await plugin_1.tools.Sleep(3000);
                                    }
                                }
                            }
                        }
                        else
                            plugin_1.tools.Log(user.nickname, '自动送礼', '包裹信息', bagInfo.body);
                    }
                    else
                        plugin_1.tools.Log(user.nickname, '自动送礼', '包裹信息', '网络错误');
                }
                else
                    plugin_1.tools.Log(user.nickname, '自动送礼', '房间信息', roomInit.body);
            }
            else
                plugin_1.tools.Log(user.nickname, '自动送礼', '房间信息', '网络错误');
        });
    }
}
exports.default = new SendGift();
