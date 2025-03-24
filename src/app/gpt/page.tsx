'use client';
// 이 포스팅은 쿠팡파트너스 활동의 일환으로, 일정액의 수수료를 제공받습니다.

// 🏆 1위 곰곰 세척 사과
// ✨ 최저가: 17,980원
// 🚀 로켓배송

// 구매링크: https://link.coupang.com/a/cewcJP

// 🏆 2위 프레샤인 GAP 인증 충주 못난이사과
// ✨ 최저가: 17,080원
// 🚀 로켓배송

// 구매링크: https://link.coupang.com/a/cewcJS


import { useState } from 'react';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState({ title: '', script: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    const data = await response.json();
    setResult(data.result);
  };

  return (
    <div>
      <h1>GPT-3 Text Generator</h1>
      <form onSubmit={handleSubmit}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          cols={50}
          placeholder="Enter product information here..."
        />
        <button type="submit">Generate</button>
      </form>
      {result.title && (
        <div>
          <h2>Title:</h2>
          <p>{result.title}</p>
          <h2>Script:</h2>
          {result.script.split("\n").map((line: string, index: number) => (
            <p key={index}>{line}</p>
          ))}
        </div>
      )}
    </div>
  );
} 