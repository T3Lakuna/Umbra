const assetPaths=["/s/audio/coin.mp3","/s/img/nebula.png","/s/font/taurus.otf"];let umbra,pointerPositionText,loadedAssets=0;onload=()=>{umbra=new Umbra(setup,void 0,"Umbra","#222",assetPaths),umbra.start()};const setup=()=>{umbra.state=main,umbra.pointer.onPress=()=>umbra.assets["/s/audio/coin.mp3"].isPlaying=!0,new ULine(new Bounds(new Vector2,new Vector2(innerWidth,0))).lineColor="#fffff0",new ULine(new Bounds(new Vector2,new Vector2(0,innerHeight))).lineColor="#fffff0",new ULine(new Bounds(new Vector2(0,innerHeight),new Vector2(innerWidth,innerHeight))).lineColor="#fffff0",new ULine(new Bounds(new Vector2(innerWidth,0),new Vector2(innerWidth,innerHeight))).lineColor="#fffff0";const e=new UText("UMBRA",new Bounds(new Vector2(innerWidth/2)));e.fillColor="#50c878",e.font="80px taurus",e.bounds.min.x-=4*umbra.context.measureText(e.text).width;const n=Math.min(innerWidth/3*2,innerHeight/2),t=new USprite(new USpritesheet(umbra.assets["/s/img/nebula.png"],new Vector2(100,100)),new Bounds(new Vector2(innerWidth/2-n/2,innerHeight/12),new Vector2(innerWidth/2-n/2+n,innerHeight/12+n)));t.fps=5,t.doLoop=!0;const o=new URect(new Bounds(new Vector2(innerWidth/6,innerHeight/12*7),new Vector2(innerWidth/6*5,innerHeight/3*2)));o.lineColor="#fffff0",o.fillColor="#333",o.onClick=()=>location.href="https://umbra-framework.readthedocs.io",new UText("Documentation",new Bounds(new Vector2(o.bounds.min.x+o.bounds.width/2-umbra.context.measureText("Documentation").width,o.bounds.min.y+o.bounds.height/2-umbra.context.measureText("M").width)),o);const i=new URect(new Bounds(new Vector2(innerWidth/6,innerHeight/6*5),new Vector2(innerWidth/6*5,innerHeight/12*11)));i.lineColor="#fffff0",i.fillColor="#333",i.onClick=()=>location.href="/p/builder.html",new UText("Download",new Bounds(new Vector2(i.bounds.min.x+i.bounds.width/2-umbra.context.measureText("Download").width,i.bounds.min.y+i.bounds.height/2-umbra.context.measureText("M").width)),i),pointerPositionText=new UText(""),pointerPositionText.fillColor="#fffff0"},main=()=>{pointerPositionText.bounds=new Bounds(umbra.pointer.pos),pointerPositionText.text=`(${umbra.pointer.pos.x}, ${umbra.pointer.pos.y})`};