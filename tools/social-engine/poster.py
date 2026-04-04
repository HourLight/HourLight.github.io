"""
馥靈之鑰 AI 自動社群發文引擎 - 發文模組
直接發文到 FB 粉專和 Threads
"""
import urllib.request
import urllib.parse
import json
import sys
import time

def post_to_fb(page_id, page_token, message, image_url=None, image_local=None):
    """發文到 Facebook 粉專（支援本地圖片上傳）"""
    import os

    if image_local and os.path.exists(image_local):
        # 本地圖片上傳（DALL-E 生成的）
        import mimetypes
        boundary = '----WebKitFormBoundary' + str(int(time.time()))
        body = b''
        # message field
        body += f'--{boundary}\r\nContent-Disposition: form-data; name="message"\r\n\r\n{message}\r\n'.encode('utf-8')
        # access_token field
        body += f'--{boundary}\r\nContent-Disposition: form-data; name="access_token"\r\n\r\n{page_token}\r\n'.encode('utf-8')
        # image file
        filename = os.path.basename(image_local)
        mime = mimetypes.guess_type(image_local)[0] or 'image/png'
        body += f'--{boundary}\r\nContent-Disposition: form-data; name="source"; filename="{filename}"\r\nContent-Type: {mime}\r\n\r\n'.encode('utf-8')
        with open(image_local, 'rb') as f:
            body += f.read()
        body += f'\r\n--{boundary}--\r\n'.encode('utf-8')

        url = f"https://graph.facebook.com/v21.0/{page_id}/photos"
        try:
            req = urllib.request.Request(url, data=body, method='POST')
            req.add_header('Content-Type', f'multipart/form-data; boundary={boundary}')
            with urllib.request.urlopen(req, timeout=60) as resp:
                result = json.loads(resp.read().decode())
                post_id = result.get('id') or result.get('post_id', 'unknown')
                return {'success': True, 'post_id': post_id}
        except urllib.error.HTTPError as e:
            error = e.read().decode()
            return {'success': False, 'error': f'Local upload failed: {error}'}

    elif image_url:
        # URL 圖片發文
        post_data = urllib.parse.urlencode({
            'message': message,
            'url': image_url,
            'access_token': page_token
        }).encode('utf-8')
        url = f"https://graph.facebook.com/v21.0/{page_id}/photos"
        try:
            req = urllib.request.Request(url, data=post_data, method='POST')
            with urllib.request.urlopen(req, timeout=30) as resp:
                result = json.loads(resp.read().decode())
                post_id = result.get('id') or result.get('post_id', 'unknown')
                return {'success': True, 'post_id': post_id}
        except urllib.error.HTTPError as e:
            error = e.read().decode()
            return {'success': False, 'error': error}

    else:
        # 純文字發文
        post_data = urllib.parse.urlencode({
            'message': message,
            'access_token': page_token
        }).encode('utf-8')
        url = f"https://graph.facebook.com/v21.0/{page_id}/feed"
        try:
            req = urllib.request.Request(url, data=post_data, method='POST')
            with urllib.request.urlopen(req, timeout=30) as resp:
                result = json.loads(resp.read().decode())
                post_id = result.get('id') or result.get('post_id', 'unknown')
                return {'success': True, 'post_id': post_id}
        except urllib.error.HTTPError as e:
            error = e.read().decode()
            return {'success': False, 'error': error}


def post_to_threads(user_id, token, message, image_url=None):
    """發文到 Threads"""
    # Step 1: Create media container
    params = {
        'media_type': 'IMAGE' if image_url else 'TEXT',
        'text': message,
        'access_token': token
    }
    if image_url:
        params['image_url'] = image_url

    post_data = urllib.parse.urlencode(params).encode('utf-8')

    try:
        req = urllib.request.Request(
            f'https://graph.threads.net/v1.0/{user_id}/threads',
            data=post_data, method='POST'
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            result = json.loads(resp.read().decode())
            container_id = result['id']
    except urllib.error.HTTPError as e:
        return {'success': False, 'error': e.read().decode()}

    # Step 2: Wait for container ready
    time.sleep(3)

    # Step 3: Publish
    pub_data = urllib.parse.urlencode({
        'creation_id': container_id,
        'access_token': token
    }).encode('utf-8')

    try:
        req = urllib.request.Request(
            f'https://graph.threads.net/v1.0/{user_id}/threads_publish',
            data=pub_data, method='POST'
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            result = json.loads(resp.read().decode())
            return {'success': True, 'post_id': result['id']}
    except urllib.error.HTTPError as e:
        return {'success': False, 'error': e.read().decode()}


def reply_to_threads(user_id, token, post_id, reply_text):
    """回覆自己的 Threads 貼文（啟動對話，提升演算法推薦）"""
    params = {
        'media_type': 'TEXT',
        'text': reply_text,
        'reply_to_id': post_id,
        'access_token': token
    }
    post_data = urllib.parse.urlencode(params).encode('utf-8')
    try:
        req = urllib.request.Request(
            f'https://graph.threads.net/v1.0/{user_id}/threads',
            data=post_data, method='POST'
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            result = json.loads(resp.read().decode())
            container_id = result['id']
        time.sleep(3)
        pub_data = urllib.parse.urlencode({
            'creation_id': container_id,
            'access_token': token
        }).encode('utf-8')
        req = urllib.request.Request(
            f'https://graph.threads.net/v1.0/{user_id}/threads_publish',
            data=pub_data, method='POST'
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            result = json.loads(resp.read().decode())
            return {'success': True, 'reply_id': result['id']}
    except Exception as e:
        return {'success': False, 'error': str(e)}


def post_all(fb_msg, threads_msg, fb_token, fb_page_id, threads_token, threads_user_id, image_url=None):
    """同時發文到 FB + Threads"""
    results = {}

    # FB
    print("📘 發文到 FB...")
    fb_result = post_to_fb(fb_page_id, fb_token, fb_msg, image_url)
    if fb_result['success']:
        print(f"   ✅ FB 成功！Post ID: {fb_result['post_id']}")
    else:
        print(f"   ❌ FB 失敗：{fb_result['error'][:200]}")
    results['fb'] = fb_result

    # Threads
    print("🧵 發文到 Threads...")
    threads_result = post_to_threads(threads_user_id, threads_token, threads_msg, image_url)
    if threads_result['success']:
        print(f"   ✅ Threads 成功！Post ID: {threads_result['post_id']}")
    else:
        print(f"   ❌ Threads 失敗：{threads_result['error'][:200]}")
    results['threads'] = threads_result

    return results


if __name__ == '__main__':
    from config import *

    # 測試用
    fb_msg = "測試發文 from 馥靈之鑰自動發文引擎"
    threads_msg = "測試發文 ✨"

    if FB_PAGE_TOKEN and THREADS_TOKEN:
        post_all(fb_msg, threads_msg, FB_PAGE_TOKEN, FB_PAGE_ID, THREADS_TOKEN, THREADS_USER_ID)
    else:
        print("請設定環境變數 FB_PAGE_TOKEN 和 THREADS_TOKEN")
