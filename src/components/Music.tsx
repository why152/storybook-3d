import {useCallback,useEffect,useRef,useState} from 'react';

const trackUrl=`${import.meta.env.BASE_URL}audio/the-long-way-home.mp3`;
const trackSource='https://www.scottbuckley.com.au/library/the-long-way-home/';
const trackLicense='https://creativecommons.org/licenses/by/4.0/';

export function MusicControl(){
  const audioRef=useRef<HTMLAudioElement>(null);
  const automatic=useRef<AbortController|null>(null);
  const [playing,setPlaying]=useState(false);
  const [failed,setFailed]=useState(false);

  const play=useCallback(()=>{
    const track=audioRef.current!;
    if(!track.paused)return;
    if(track.error)track.load();
    setFailed(false);
    void track.play().catch((error:unknown)=>{
      if(error instanceof DOMException&&(error.name==='AbortError'||error.name==='NotAllowedError'))return;
      setPlaying(false);
      setFailed(true);
    });
  },[]);

  useEffect(()=>{
    const track=audioRef.current!;
    const controller=new AbortController();
    automatic.current=controller;
    const startAfterGesture=(event:Event)=>{
      if(!event.isTrusted)return;
      const target=event.target instanceof Element?event.target:null;
      if(target?.closest('.music-control'))return;
      if(event instanceof KeyboardEvent&&event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;
      if(event.type!=='click'&&!(event instanceof KeyboardEvent)&&!target?.closest('.book-viewport'))return;
      play();
    };
    const options={capture:true,signal:controller.signal};
    for(const gesture of ['click','keydown','pointerup','touchend']){
      document.addEventListener(gesture,startAfterGesture,options);
    }
    queueMicrotask(()=>{
      if(!controller.signal.aborted)play();
    });
    return ()=>{
      controller.abort();
      track.pause();
    };
  },[play]);

  const toggle=()=>{
    automatic.current?.abort();
    const track=audioRef.current!;
    if(track.paused)play();
    else track.pause();
  };

  return <div className="music-control">
    <audio ref={audioRef} src={trackUrl} preload="none" loop
      onPlay={()=>{automatic.current?.abort();setPlaying(true);}} onPause={()=>setPlaying(false)}
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
