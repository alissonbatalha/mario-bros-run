const mario = document.querySelector(".mario");
const pipe = document.querySelector(".pipe");
let placar = document.querySelector(".placar");

const jump = () => {
  mario.classList.add("jump");

  setTimeout(() => {
    mario.classList.remove("jump");
  }, 500);
};

const loop = setInterval(() => {
  const pipePosition = pipe.offsetLeft;
  const marioPositionX = mario.offsetLeft;
  const marioPosition = +window
    .getComputedStyle(mario)
    .bottom.replace("px", "");

  if (pipePosition <= 60 && pipePosition > 0 && marioPosition < 40) {
    pipe.style.animation = "none";
    pipe.style.left = `${pipePosition}px`;

    mario.style.animation = "none";
    mario.style.bottom = `${marioPosition}px`;

    mario.src = "./images/game-over.png";
    mario.style.width = "40px";
    mario.style.marginLeft = "25px";

    clearInterval(loop);
  }
}, 5);

const pontua = setInterval(() => {
  const pipePosition = pipe.offsetLeft;
  const marioPositionX = mario.offsetLeft;
  const marioPosition = +window
    .getComputedStyle(mario)
    .bottom.replace("px", "");

  if (marioPositionX > pipePosition) {
    placar.innerText++;
  }
}, 500);

document.addEventListener("keydown", jump);


