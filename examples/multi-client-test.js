import E2EClient from './client.js';

/**
 * 多客户端测试
 * 演示多个客户端同时连接到同一个房间
 */
const multiClientTest = async () => {
    console.log('========================================');
    console.log('  多客户端测试  ');
    console.log('========================================\n');

    // 创建三个客户端
    const client1 = new E2EClient('ws://localhost:8080');
    const client2 = new E2EClient('ws://localhost:8080');
    const client3 = new E2EClient('ws://localhost:8080');

    try {
        // 步骤 1: 连接所有客户端
        console.log('步骤 1: 连接所有客户端...');
        await Promise.all([
            client1.connect(),
            client2.connect(),
            client3.connect()
        ]);
        console.log('✓ 所有客户端已连接\n');
        await sleep(1000);

        // 步骤 2: 客户端1创建房间（成为管理员）
        console.log('步骤 2: 客户端1创建房间...');
        const roomData = await client1.joinRoom(null, 'read_write');
        const roomId = roomData.roomId;
        console.log(`✓ 房间已创建: ${roomId}\n`);
        await sleep(1000);

        // 步骤 3: 客户端2加入房间（读写权限）
        console.log('步骤 3: 客户端2以读写权限加入房间...');
        await client2.joinRoom(roomId, 'read_write');
        console.log('✓ 客户端2已加入\n');
        await sleep(1000);

        // 步骤 4: 客户端3加入房间（只读权限）
        console.log('步骤 4: 客户端3以只读权限加入房间...');
        await client3.joinRoom(roomId, 'read_only');
        console.log('✓ 客户端3已加入\n');
        await sleep(1000);

        // 步骤 5: 获取房间信息
        console.log('步骤 5: 获取房间信息...');
        const roomInfo = await client1.getRoomInfo();
        console.log(`房间ID: ${roomInfo.id}`);
        console.log(`成员数量: ${roomInfo.memberCount}/${roomInfo.maxMembers}`);
        console.log('成员列表:');
        roomInfo.members.forEach((member, index) => {
            console.log(`  ${index + 1}. ID: ${member.id.substring(0, 8)}... 权限: ${member.permission}`);
        });
        console.log();
        await sleep(1000);

        // 步骤 6: 客户端1发送消息（广播）
        console.log('步骤 6: 客户端1发送广播消息...');
        client1.sendMessage('大家好！我是管理员');
        await sleep(1000);

        // 步骤 7: 客户端2发送消息
        console.log('\n步骤 7: 客户端2发送消息...');
        client2.sendMessage('你好管理员！');
        await sleep(1000);

        // 步骤 8: 客户端3尝试发送消息（应该失败，因为只读权限）
        console.log('\n步骤 8: 客户端3尝试发送消息（只读权限）...');
        try {
            client3.sendMessage('我也想说话！');
        } catch (error) {
            console.log('✗ 预期错误：只读权限无法发送消息');
        }
        await sleep(2000);

        // 步骤 9: 客户端1（管理员）将客户端3的权限改为读写
        console.log('\n步骤 9: 管理员将客户端3权限改为读写...');
        client1.updatePermission(client3.clientId, 'read_write');
        await sleep(2000);

        // 步骤 10: 客户端3再次发送消息（现在应该成功）
        console.log('\n步骤 10: 客户端3再次发送消息...');
        client3.sendMessage('太好了！现在我可以说话了！');
        await sleep(1000);

        // 步骤 11: 客户端1点对点发送消息给客户端2
        console.log('\n步骤 11: 客户端1点对点发送消息给客户端2...');
        client1.sendMessage('这是私密消息', client2.clientId);
        await sleep(1000);

        // 步骤 12: 客户端2离开房间
        console.log('\n步骤 12: 客户端2离开房间...');
        await client2.leaveRoom();
        await sleep(1000);

        // 步骤 13: 客户端1踢出客户端3
        console.log('\n步骤 13: 管理员踢出客户端3...');
        client1.kickMember(client3.clientId);
        await sleep(2000);

        // 步骤 14: 客户端1离开房间
        console.log('\n步骤 14: 客户端1离开房间...');
        await client1.leaveRoom();
        await sleep(1000);

        // 步骤 15: 断开所有连接
        console.log('\n步骤 15: 断开所有连接...');
        client1.disconnect();
        client2.disconnect();
        client3.disconnect();

        console.log('\n========================================');
        console.log('  测试完成！  ');
        console.log('========================================\n');

    } catch (error) {
        console.error('测试出错:', error.message);

        // 清理连接
        client1.disconnect();
        client2.disconnect();
        client3.disconnect();
    }
};

/**
 * 休眠函数
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 运行测试
multiClientTest();

