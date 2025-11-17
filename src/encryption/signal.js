import crypto from 'crypto';

/**
 * Signal 协议端到端加密实现
 * 简化版本，用于演示端到端加密的概念
 * 
 * 注意：生产环境建议使用完整的 Signal Protocol 库
 * 这里提供一个简化的实现用于演示
 */
export class SignalEncryption {
    constructor() {
        // 存储客户端公钥
        this.publicKeys = new Map();
    }

    /**
     * 生成密钥对
     */
    generateKeyPair() {
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem'
            }
        });

        return { publicKey, privateKey };
    }

    /**
     * 注册客户端公钥
     */
    registerPublicKey(clientId, publicKey) {
        this.publicKeys.set(clientId, publicKey);
    }

    /**
     * 获取客户端公钥
     */
    getPublicKey(clientId) {
        return this.publicKeys.get(clientId);
    }

    /**
     * 移除客户端公钥
     */
    removePublicKey(clientId) {
        this.publicKeys.delete(clientId);
    }

    /**
     * 使用公钥加密数据
     */
    encrypt(data, publicKey) {
        try {
            const buffer = Buffer.from(JSON.stringify(data), 'utf8');
            const encrypted = crypto.publicEncrypt(
                {
                    key: publicKey,
                    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                    oaepHash: 'sha256'
                },
                buffer
            );
            return encrypted.toString('base64');
        } catch (error) {
            console.error('Encryption error:', error);
            throw new Error('Failed to encrypt data');
        }
    }

    /**
     * 使用私钥解密数据
     */
    decrypt(encryptedData, privateKey) {
        try {
            const buffer = Buffer.from(encryptedData, 'base64');
            const decrypted = crypto.privateDecrypt(
                {
                    key: privateKey,
                    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                    oaepHash: 'sha256'
                },
                buffer
            );
            return JSON.parse(decrypted.toString('utf8'));
        } catch (error) {
            console.error('Decryption error:', error);
            throw new Error('Failed to decrypt data');
        }
    }

    /**
     * 生成共享密钥（用于对称加密）
     */
    generateSharedKey() {
        return crypto.randomBytes(32).toString('base64');
    }

    /**
     * 使用共享密钥加密（AES-256-GCM）
     */
    encryptWithSharedKey(data, sharedKey) {
        try {
            const iv = crypto.randomBytes(16);
            const key = Buffer.from(sharedKey, 'base64');
            const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

            let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'base64');
            encrypted += cipher.final('base64');

            const authTag = cipher.getAuthTag();

            return {
                encrypted,
                iv: iv.toString('base64'),
                authTag: authTag.toString('base64')
            };
        } catch (error) {
            console.error('Shared key encryption error:', error);
            throw new Error('Failed to encrypt with shared key');
        }
    }

    /**
     * 使用共享密钥解密（AES-256-GCM）
     */
    decryptWithSharedKey(encryptedData, sharedKey, iv, authTag) {
        try {
            const key = Buffer.from(sharedKey, 'base64');
            const decipher = crypto.createDecipheriv(
                'aes-256-gcm',
                key,
                Buffer.from(iv, 'base64')
            );

            decipher.setAuthTag(Buffer.from(authTag, 'base64'));

            let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
            decrypted += decipher.final('utf8');

            return JSON.parse(decrypted);
        } catch (error) {
            console.error('Shared key decryption error:', error);
            throw new Error('Failed to decrypt with shared key');
        }
    }

    /**
     * 签名数据
     */
    sign(data, privateKey) {
        try {
            const sign = crypto.createSign('SHA256');
            sign.update(JSON.stringify(data));
            sign.end();
            return sign.sign(privateKey, 'base64');
        } catch (error) {
            console.error('Signing error:', error);
            throw new Error('Failed to sign data');
        }
    }

    /**
     * 验证签名
     */
    verify(data, signature, publicKey) {
        try {
            const verify = crypto.createVerify('SHA256');
            verify.update(JSON.stringify(data));
            verify.end();
            return verify.verify(publicKey, signature, 'base64');
        } catch (error) {
            console.error('Verification error:', error);
            return false;
        }
    }
}

