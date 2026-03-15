#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
视频源搜索支持检测脚本
测试视频采集接口是否支持关键词搜索功能
"""

import requests
import json
import time
from urllib.parse import urlencode

# 测试的视频源列表
VIDEO_SOURCES = [
    {"name": "无尽资源", "url": "https://api.wujinapi.me/api.php/provide/vod"},
    {"name": "茅台资源", "url": "https://caiji.maotaizy.cc/api.php/provide/vod"},
    {"name": "猫眼资源", "url": "https://api.maoyanapi.top/api.php/provide/vod"},
    {"name": "百度资源", "url": "https://api.apibdzy.com/api.php/provide/vod"},
    {"name": "红牛资源", "url": "https://www.hongniuzy2.com/api.php/provide/vod"},
    {"name": "无水印", "url": "https://api.wsyzy.net/api.php/provide/vod"},
]

# 测试关键词
TEST_KEYWORD = "爱情"

def test_search_support(name, url, keyword=TEST_KEYWORD, timeout=15):
    """
    测试视频源是否支持搜索
    
    Args:
        name: 视频源名称
        url: 视频源API地址
        keyword: 测试关键词
        timeout: 超时时间（秒）
    
    Returns:
        dict: 测试结果
    """
    print(f"\n{'='*60}")
    print(f"测试源: {name}")
    print(f"{'='*60}")
    
    # 构建搜索URL
    search_url = f"{url}?ac=videolist&wd={keyword}"
    print(f"请求URL: {search_url}")
    
    try:
        start_time = time.time()
        
        # 发送请求
        response = requests.get(
            search_url,
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json'
            },
            timeout=timeout
        )
        
        elapsed = time.time() - start_time
        print(f"响应时间: {elapsed:.2f}秒")
        print(f"HTTP状态: {response.status_code}")
        
        if response.status_code != 200:
            return {
                "name": name,
                "url": url,
                "support": False,
                "reason": f"HTTP {response.status_code}",
                "elapsed": elapsed
            }
        
        # 检查响应内容
        text = response.text
        
        # 检查是否明确不支持搜索
        if "暂不支持搜索" in text or "不支持搜索" in text:
            print("❌ 不支持搜索: 接口返回'暂不支持搜索'")
            return {
                "name": name,
                "url": url,
                "support": False,
                "reason": "接口返回'暂不支持搜索'",
                "elapsed": elapsed
            }
        
        # 尝试解析JSON
        try:
            data = json.loads(text)
            
            if not isinstance(data.get('list'), list):
                print("❌ 不支持搜索: 返回数据格式无效")
                return {
                    "name": name,
                    "url": url,
                    "support": False,
                    "reason": "返回数据格式无效",
                    "elapsed": elapsed
                }
            
            result_count = len(data['list'])
            print(f"返回结果数: {result_count}")
            
            if result_count == 0:
                print("⚠️  可能不支持搜索: 返回0条结果")
                return {
                    "name": name,
                    "url": url,
                    "support": "unknown",
                    "reason": "返回0条结果（可能关键词不匹配）",
                    "elapsed": elapsed
                }
            
            # 检查结果相关性
            relevant_count = 0
            for item in data['list'][:5]:  # 只检查前5条
                vod_name = item.get('vod_name', '').lower()
                if keyword.lower() in vod_name:
                    relevant_count += 1
            
            print(f"\n前5条结果:")
            for i, item in enumerate(data['list'][:5], 1):
                vod_name = item.get('vod_name', '未知')
                vod_id = item.get('vod_id', '?')
                match = "✓" if keyword.lower() in vod_name.lower() else "✗"
                print(f"  {i}. [{match}] {vod_name} (ID: {vod_id})")
            
            if relevant_count == 0:
                print(f"\n⚠️  可能不支持搜索: 前5条结果都不包含关键词'{keyword}'")
                return {
                    "name": name,
                    "url": url,
                    "support": False,
                    "reason": f"返回{result_count}条结果但都不相关",
                    "elapsed": elapsed,
                    "result_count": result_count
                }
            
            print(f"\n✅ 支持搜索: 返回{result_count}条结果，其中{relevant_count}条相关")
            return {
                "name": name,
                "url": url,
                "support": True,
                "reason": f"返回{result_count}条结果，{relevant_count}条相关",
                "elapsed": elapsed,
                "result_count": result_count,
                "relevant_count": relevant_count
            }
            
        except json.JSONDecodeError as e:
            print(f"❌ JSON解析失败: {e}")
            print(f"响应内容前500字符: {text[:500]}")
            return {
                "name": name,
                "url": url,
                "support": False,
                "reason": "JSON解析失败",
                "elapsed": elapsed
            }
    
    except requests.Timeout:
        print(f"❌ 请求超时 (>{timeout}秒)")
        return {
            "name": name,
            "url": url,
            "support": False,
            "reason": f"请求超时 (>{timeout}秒)",
            "elapsed": timeout
        }
    
    except requests.RequestException as e:
        print(f"❌ 请求失败: {e}")
        return {
            "name": name,
            "url": url,
            "support": False,
            "reason": str(e),
            "elapsed": 0
        }

def main():
    """主函数"""
    print("🔍 视频源搜索支持检测工具")
    print(f"测试关键词: {TEST_KEYWORD}")
    print(f"共 {len(VIDEO_SOURCES)} 个视频源\n")
    
    results = []
    
    # 测试所有视频源
    for source in VIDEO_SOURCES:
        result = test_search_support(source['name'], source['url'])
        results.append(result)
        time.sleep(1)  # 避免请求过快
    
    # 输出汇总
    print(f"\n\n{'='*60}")
    print("测试汇总")
    print(f"{'='*60}\n")
    
    support_count = sum(1 for r in results if r['support'] is True)
    not_support_count = sum(1 for r in results if r['support'] is False)
    unknown_count = sum(1 for r in results if r['support'] == 'unknown')
    
    print(f"✅ 支持搜索: {support_count} 个")
    print(f"❌ 不支持搜索: {not_support_count} 个")
    print(f"⚠️  未知状态: {unknown_count} 个\n")
    
    print("详细结果:")
    print(f"{'源名称':<12} {'支持搜索':<10} {'响应时间':<10} {'原因'}")
    print("-" * 60)
    
    for r in results:
        support_icon = "✅" if r['support'] is True else ("❌" if r['support'] is False else "⚠️")
        support_text = "是" if r['support'] is True else ("否" if r['support'] is False else "未知")
        elapsed_text = f"{r['elapsed']:.2f}秒" if r['elapsed'] > 0 else "N/A"
        print(f"{r['name']:<12} {support_icon} {support_text:<8} {elapsed_text:<10} {r['reason']}")
    
    # 推荐配置
    print(f"\n{'='*60}")
    print("推荐配置")
    print(f"{'='*60}\n")
    
    supported_sources = [r for r in results if r['support'] is True]
    
    if supported_sources:
        print("建议使用以下支持搜索的视频源：\n")
        
        # 简单格式
        simple_format = ",".join([f"{r['name']}|{r['url']}" for r in supported_sources])
        print("简单格式（推荐用于 Cloudflare Pages）:")
        print(f"VITE_INITIAL_VIDEO_SOURCES={simple_format}\n")
        
        # JSON格式
        json_format = json.dumps([
            {"name": r['name'], "url": r['url'], "isEnabled": True}
            for r in supported_sources
        ], ensure_ascii=False)
        print("JSON格式（本地开发）:")
        print(f"VITE_INITIAL_VIDEO_SOURCES={json_format}")
    else:
        print("⚠️  没有找到支持搜索的视频源")

if __name__ == "__main__":
    main()
