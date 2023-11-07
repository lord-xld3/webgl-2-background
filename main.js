(()=>{"use strict";var t={};t.g=function(){if("object"==typeof globalThis)return globalThis;try{return this||new Function("return this")()}catch(t){if("object"==typeof window)return window}}(),(()=>{var r;t.g.importScripts&&(r=t.g.location+"");var e=t.g.document;if(!r&&e&&(e.currentScript&&(r=e.currentScript.src),!r)){var n=e.getElementsByTagName("script");if(n.length)for(var o=n.length-1;o>-1&&!r;)r=n[o--].src}if(!r)throw new Error("Automatic publicPath is not supported in this browser");r=r.replace(/#.*$/,"").replace(/\?.*$/,"").replace(/\/[^\/]+$/,"/"),t.p=r})(),(()=>{function t(t,r,e,n){const o=t.createBuffer();return t.bindBuffer(e,o),t.bufferData(e,r,n),o}var r=1e-6,e="undefined"!=typeof Float32Array?Float32Array:Array;Math.random;Math.PI;function n(){var t=new e(16);return e!=Float32Array&&(t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[6]=0,t[7]=0,t[8]=0,t[9]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0),t[0]=1,t[5]=1,t[10]=1,t[15]=1,t}function o(t){return t[0]=1,t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[5]=1,t[6]=0,t[7]=0,t[8]=0,t[9]=0,t[10]=1,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,t}function i(t,e,n,o){var i,a,c,h,l,s,u,f,A,d,p,v,w,E,g,R,m,b,F,_,T,y,M,S,B=o[0],P=o[1],I=o[2],L=Math.hypot(B,P,I);return L<r?null:(B*=L=1/L,P*=L,I*=L,i=Math.sin(n),c=1-(a=Math.cos(n)),h=e[0],l=e[1],s=e[2],u=e[3],f=e[4],A=e[5],d=e[6],p=e[7],v=e[8],w=e[9],E=e[10],g=e[11],R=B*B*c+a,m=P*B*c+I*i,b=I*B*c-P*i,F=B*P*c-I*i,_=P*P*c+a,T=I*P*c+B*i,y=B*I*c+P*i,M=P*I*c-B*i,S=I*I*c+a,t[0]=h*R+f*m+v*b,t[1]=l*R+A*m+w*b,t[2]=s*R+d*m+E*b,t[3]=u*R+p*m+g*b,t[4]=h*F+f*_+v*T,t[5]=l*F+A*_+w*T,t[6]=s*F+d*_+E*T,t[7]=u*F+p*_+g*T,t[8]=h*y+f*M+v*S,t[9]=l*y+A*M+w*S,t[10]=s*y+d*M+E*S,t[11]=u*y+p*M+g*S,e!==t&&(t[12]=e[12],t[13]=e[13],t[14]=e[14],t[15]=e[15]),t)}Math.hypot||(Math.hypot=function(){for(var t=0,r=arguments.length;r--;)t+=arguments[r]*arguments[r];return Math.sqrt(t)});var a=function(t,r,e,n,o){var i,a=1/Math.tan(r/2);return t[0]=a/e,t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[5]=a,t[6]=0,t[7]=0,t[8]=0,t[9]=0,t[11]=-1,t[12]=0,t[13]=0,t[15]=0,null!=o&&o!==1/0?(i=1/(n-o),t[10]=(o+n)*i,t[14]=2*o*n*i):(t[10]=-1,t[14]=-2*n),t};const c=document.getElementById("canvas"),h=c.getContext("webgl2");if(!h)throw new Error("WebGL2 not supported");const l=function(t,r,e){function n(r,e){const n=t.createShader(e);if(t.shaderSource(n,r),t.compileShader(n),!t.getShaderParameter(n,t.COMPILE_STATUS)){const e=t.getShaderInfoLog(n);throw new Error(`Could not compile shader: ${r} \n\n${e}`)}return n}const o=n(r,t.VERTEX_SHADER),i=n(e,t.FRAGMENT_SHADER),a=t.createProgram();if(t.attachShader(a,o),t.attachShader(a,i),t.linkProgram(a),!t.getProgramParameter(a,t.LINK_STATUS)){const r=t.getProgramInfoLog(a);throw new Error(`Could not link shader program. \n\n${r}`)}return a}(h,"#version 300 es\n\tin vec4 position;\n\tin vec4 color;\n\tin mat4 model;\n\tuniform mat4 view;\n\tuniform mat4 projection;\n\t\n\tout vec4 v_color;\n\n\tvoid main() {\n\t\tgl_Position = projection * view * model * position;\n\t\tv_color = color;\n\t}\n","#version 300 es\n\tprecision highp float;\n\tin vec4 v_color;\n\t\n\tout vec4 outColor;\n\n\tvoid main() {\n\t\toutColor = v_color;\n\t}\n"),s=function(t,r,e){let n={};for(let o=0;o<e.length;o++)n[e[o]]=t.getAttribLocation(r,e[o]);return n}(h,l,["position","color","model"]),u=function(t,r,e){let n={};for(let o=0;o<e.length;o++)n[e[o]]=t.getUniformLocation(r,e[o]);return n}(h,l,["view","projection"]),f=h.createVertexArray();h.bindVertexArray(f);const A=t(h,new Float32Array([-.5,-.5,-.5,.5,-.5,-.5,.5,.5,-.5,-.5,.5,-.5,-.5,-.5,.5,.5,-.5,.5,.5,.5,.5,-.5,.5,.5]),h.ARRAY_BUFFER,h.STATIC_DRAW);h.bindBuffer(h.ARRAY_BUFFER,A),h.enableVertexAttribArray(s.position),h.vertexAttribPointer(s.position,3,h.FLOAT,!1,0,0);const d=t(h,new Uint16Array([0,1,2,2,3,0,1,5,6,6,2,1,5,4,7,7,6,5,4,0,3,3,7,4,3,2,6,6,7,3,4,5,1,1,0,4]),h.ELEMENT_ARRAY_BUFFER,h.STATIC_DRAW);h.bindBuffer(h.ELEMENT_ARRAY_BUFFER,d);const p=new Float32Array(64),v=[];for(let t=0;t<4;++t){const r=16*t*4,e=16;v.push(new Float32Array(p.buffer,r,e))}const w=t(h,p,h.ARRAY_BUFFER,h.DYNAMIC_DRAW);for(let t=0;t<4;t++){const r=s.model+t;h.enableVertexAttribArray(r);const e=16*t;h.vertexAttribPointer(r,4,h.FLOAT,!1,64,e),h.vertexAttribDivisor(r,1)}t(h,new Float32Array([1,0,0,1,0,1,0,1,0,0,1,1,1,1,0,1]),h.ARRAY_BUFFER,h.STATIC_DRAW),h.enableVertexAttribArray(s.color),h.vertexAttribPointer(s.color,4,h.FLOAT,!1,0,0),h.vertexAttribDivisor(s.color,1);const E=(g=n(),m=[0,0,0],b=[0,1,0],U=(R=[0,1,3.5])[0],D=R[1],x=R[2],C=b[0],N=b[1],Y=b[2],O=m[0],j=m[1],H=m[2],Math.abs(U-O)<r&&Math.abs(D-j)<r&&Math.abs(x-H)<r?o(g):(B=U-O,P=D-j,I=x-H,F=N*(I*=L=1/Math.hypot(B,P,I))-Y*(P*=L),_=Y*(B*=L)-C*I,T=C*P-N*B,(L=Math.hypot(F,_,T))?(F*=L=1/L,_*=L,T*=L):(F=0,_=0,T=0),y=P*T-I*_,M=I*F-B*T,S=B*_-P*F,(L=Math.hypot(y,M,S))?(y*=L=1/L,M*=L,S*=L):(y=0,M=0,S=0),g[0]=F,g[1]=y,g[2]=B,g[3]=0,g[4]=_,g[5]=M,g[6]=P,g[7]=0,g[8]=T,g[9]=S,g[10]=I,g[11]=0,g[12]=-(F*U+_*D+T*x),g[13]=-(y*U+M*D+S*x),g[14]=-(B*U+P*D+I*x),g[15]=1,g));var g,R,m,b,F,_,T,y,M,S,B,P,I,L,U,D,x,C,N,Y,O,j,H;const V=a(n(),45,c.width/c.height,.1,100);window.addEventListener("resize",(function(){c.width=window.innerWidth,c.height=window.innerHeight,h.viewport(0,0,c.width,c.height),a(n(),45,c.width/c.height,.1,100)}));let W=0,$=2*Math.PI;h.enable(h.DEPTH_TEST),h.useProgram(l),window.dispatchEvent(new Event("resize")),function t(){h.clearColor(0,0,0,0),h.clear(h.COLOR_BUFFER_BIT|h.DEPTH_BUFFER_BIT),h.uniformMatrix4fv(u.view,!1,i(E,E,.01,[1,0,0])),h.uniformMatrix4fv(u.projection,!1,V),W=(W+.01)%$,v.forEach(((t,r)=>{o(t),function(t,r,e){var n,o,i,a,c,h,l,s,u,f,A,d,p=e[0],v=e[1],w=e[2];r===t?(t[12]=r[0]*p+r[4]*v+r[8]*w+r[12],t[13]=r[1]*p+r[5]*v+r[9]*w+r[13],t[14]=r[2]*p+r[6]*v+r[10]*w+r[14],t[15]=r[3]*p+r[7]*v+r[11]*w+r[15]):(n=r[0],o=r[1],i=r[2],a=r[3],c=r[4],h=r[5],l=r[6],s=r[7],u=r[8],f=r[9],A=r[10],d=r[11],t[0]=n,t[1]=o,t[2]=i,t[3]=a,t[4]=c,t[5]=h,t[6]=l,t[7]=s,t[8]=u,t[9]=f,t[10]=A,t[11]=d,t[12]=n*p+c*v+u*w+r[12],t[13]=o*p+h*v+f*w+r[13],t[14]=i*p+l*v+A*w+r[14],t[15]=a*p+s*v+d*w+r[15])}(t,t,[2*r-3,0,0]),i(t,t,Math.sin(W)*Math.PI*(.3+.5*r),[1,.5,-.7])})),h.bindBuffer(h.ARRAY_BUFFER,w),h.bufferSubData(h.ARRAY_BUFFER,0,p),h.drawElementsInstanced(h.TRIANGLES,36,h.UNSIGNED_SHORT,0,4),requestAnimationFrame(t)}()})(),t.p,t.p,t.p,t.p,t.p})();