import {useRef,useState} from 'react';

const trackUrl=`${import.meta.env.BASE_URL}audio/the-long-way-home.mp3`;
const trackSource='https://www.scottbuckley.com.au/library/the-long-way-home/';
const trackLicense='https://creativecommons.org/licenses/by/4.0/';

export function MusicControl(){
  const audioRef=useRef<HTMLAudioElement>(null);
  const [playing,setPlaying]=useState(false);
  const [failed,setFailed]=useState(false);

  const toggle=()=>{
    const track=audioRef.current!;
    if(!track.paused){
      track.pause();
      return;
    }
    if(!track.getAttribute('src')||track.error)track.src=trackUrl;
    setFailed(false);
    void track.play().catch((error:unknown)=>{
      if(error instanceof DOMException&&error.name==='AbortError')return;
      setPlaying(false);
      setFailed(true);
    });
  };

  return <div className="music-control">
    <audio ref={audioRef} preload="none" loop onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)}
      onError={()=>{setPlaying(false);setFailed(true);}}/>
    <button type="button" className="customize-trigger music-trigger" aria-label="背景音乐"
      aria-pressed={playing} onClick={toggle}>
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 9v6h4l5 4V5L8 9H4z"/>
        {playing?<path d="M16 9c2 1.5 2 4.5 0 6m3-9c4 3 4 9 0 12"/>:<path d="m17 10 5 5m0-5-5 5"/>}
      </svg>
      <span aria-hidden="true">{playing?'音乐已开':'音乐已关'}</span>
    </button>
    {failed&&<small className="music-error" role="status">音乐暂时无法播放</small>}
  </div>;
}

export function MusicCredit(){
  return <span className="music-credit">配乐 <a href={trackSource} lang="en">The Long Way Home · Scott Buckley</a> ·{' '}
    <a href={trackLicense} aria-label="署名 4.0 国际许可">CC BY 4.0</a>
    <span className="music-edit">（音量下调、重新编码）</span>
  </span>;
}
