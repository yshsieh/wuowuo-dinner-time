import React, { Component }     from 'react';
import Draggable                from 'react-draggable';
import $                        from 'jquery';
import Slider                   from 'rc-slider';
import { FacebookShareButton,
         FacebookIcon }         from 'react-share';
import Modal                    from 'react-modal';

import 'rc-slider/assets/index.css';
import './CoverEditorComponent.css';

const imgPath = process.env.PUBLIC_URL + '/assets/';
const defaultSliderValue = 50

const modalStyles = {
  content : {
    top                   : '0',
    left                  : '0',
    right                 : 'auto',
    bottom                : 'auto',
    marginRight           : '0',
    transform             : 'translate(-50%, -50%)'
  }
};

function newCanvasSize(w, h, rotation) {
    let rads = rotation * Math.PI / 180;
    let c = Math.cos(rads);
    let s = Math.sin(rads);
    if (s < 0) {
        s = -s;
    }
    if (c < 0) {
        c = -c;
    }
    return [h * s + w * c,h * c + w * s];
}

function getOrientation(file, callback) {
  let reader = new FileReader();
  reader.onload = function(e) {

    let view = new DataView(e.target.result);
    if (view.getUint16(0, false) !== 0xFFD8) return callback(-2);
    let length = view.byteLength, offset = 2;
    while (offset < length) {
      let marker = view.getUint16(offset, false);
      offset += 2;
      if (marker === 0xFFE1) {
        if (view.getUint32(offset += 2, false) !== 0x45786966) return callback(-1);
        let little = view.getUint16(offset += 6, false) === 0x4949;
        offset += view.getUint32(offset + 4, little);
        let tags = view.getUint16(offset, little);
        offset += 2;
        for (let i = 0; i < tags; i++)
          if (view.getUint16(offset + (i * 12), little) === 0x0112)
            return callback(view.getUint16(offset + (i * 12) + 8, little));
      }
      else if ((marker & 0xFF00) !== 0xFF00) break;
      else offset += view.getUint16(offset, false);
    }
    return callback(-1);
  };
  reader.readAsArrayBuffer(file);
}

function getImgSize(element) {
  return {
    width: $(element).width(),
    height: $(element).height(),
  }
}

class App extends Component {

  constructor(props) {
    super();
    this.state = {
      activeDrags: 0,
      sliderValue: defaultSliderValue,
      draggablePostion: {
        x: 0, y: 100
      },
      userImgSize: {
        w: 0, h: 0
      },
      modalDraggablePostion: {
        x: 0, y: 100
      },
      modalUserImgSize: {
        w: 0, h: 0
      },
      modalIsOpen: false,
    }
  }

  onUpload = (e) => {
    let file          = document.querySelector('input[type=file]').files[0];
    let resizeReader  = new FileReader();

    this.setState({ sliderValue: defaultSliderValue })

    if (!file) {
      return
    } else if (!(file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/gif')) {
      // alert
    } else {
      resizeReader.readAsDataURL(file);
    }

    resizeReader.onloadend = function () {
        let image = new Image();

        image.src = resizeReader.result;
        image.onload = function (imageEvent) {

            /* Resize */
            let canvas = document.createElement('canvas'),
                max_size = 1024,
                width = image.width,
                height = image.height;
            if (width > height) {
                if (width > max_size) {
                    height *= max_size / width;
                    width = max_size;
                }
            } else {
                if (height > max_size) {
                    width *= max_size / height;
                    height = max_size;
                }
            }

            /* set new orientation */
            getOrientation(file, (orientation) => {

              let oriWidth = width
              let oriHeight = height
              let degrees = 0;
              if (orientation === 6) {
                console.log('rotate 90degree');
                degrees = 90;
              } else if (orientation === 3) {
                console.log('rotate 180degree');
                degrees = 180;
              } else if (orientation === 8) {
                console.log('rotate 180degree');
                degrees = 270;
              }
              let newSize = newCanvasSize(oriWidth, oriHeight, degrees);
              canvas.width = newSize[0];
              canvas.height = newSize[1];
              let ctx = canvas.getContext("2d");
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.save();
              ctx.translate(canvas.width/2, canvas.height/2);
              ctx.rotate(degrees*Math.PI/180);
              ctx.drawImage(image, -oriWidth/2, -oriHeight/2, oriWidth, oriHeight);
              ctx.restore();

              /* Update img src with data url */
              let imgDataUrl = canvas.toDataURL('image/jpeg');
              document.getElementById('user-img').setAttribute('src', imgDataUrl);
              //document.getElementById('user-img-modal').setAttribute('src', imgDataUrl);


            })
        }
     }
  }

  onImgLoad = (e) => {
    this.setState({
      draggablePostion:
        {
          x: (getImgSize('.drag-area').width - getImgSize('.user-img').width)/2.0,
          y: (getImgSize('.drag-area').height - getImgSize('.user-img').height)/2.0 + 20
        },
      userImgSize:
        {
          w: getImgSize('.user-img').width,
          h: getImgSize('.user-img').height
        }
    })
  }

  onModalImgLoad = (e) => {
    this.setState({
      modalDraggablePostion:
        {
          x: (getImgSize('.drag-area-modal').width - getImgSize('.user-img-modal').width)/2.0,
          y: (getImgSize('.drag-area-modal').height - getImgSize('.user-img-modal').height)/2.0 + 20
        },
      modalUserImgSize:
        {
          w: getImgSize('.user-img-modal').width,
          h: getImgSize('.user-img-modal').height
        }
    })
  }

  onResize = (number) => {
    const { userImgSize } = this.state

    $('.user-img').css( "maxWidth", userImgSize.w + userImgSize.w*(number - 50)/100.0 + "px" )
    $('.user-img').css( "maxHeight", userImgSize.h + userImgSize.h*(number - 50)/100.0 + "px" )

    this.setState({ sliderValue: number })
  }

  onModalResize = (number) => {
    const { modalUserImgSize } = this.state

    $('.user-img-modal').css( "maxWidth", modalUserImgSize.w + modalUserImgSize.w*(number - 50)/100.0 + "px" )
    $('.user-img-modal').css( "maxHeight", modalUserImgSize.h + modalUserImgSize.h*(number - 50)/100.0 + "px" )
  }

  onStart = () => {
    const { activeDrags } = this.state
    this.setState({
      activeDrags: activeDrags + 1,
      draggablePostion: null,
      modalDraggablePostion: null,
    });

  }

  onStop = () => {
    const { activeDrags } = this.state
    this.setState({activeDrags: activeDrags - 1});
  }

  download = () => {
    let scale = 3

    let coverImg = $('.cover-img')
    let userImg  = $('.user-img')

    let coverImage = new Image();
    coverImage.src = coverImg.attr('src');

    let userImage = new Image();
    userImage.src = userImg.attr('src');

    let resize_canvas = document.getElementById("result");
    resize_canvas.width = coverImg.width()*scale;
    resize_canvas.height = coverImg.height()*scale;

    let ctx = resize_canvas.getContext("2d");
    ctx.rect(0, 0, coverImg.width()*scale, coverImg.height()*scale);
    ctx.fillStyle = "#CCCCCC";
    ctx.fill();
    ctx.drawImage(userImage, userImg.offset().left*scale - coverImg.offset().left*scale, userImg.offset().top*scale - coverImg.offset().top*scale, userImg.width()*scale, userImg.height()*scale);
    ctx.drawImage(coverImage, 0, 0, coverImg.width()*scale, coverImg.height()*scale);

    const base64 = resize_canvas.toDataURL("image/png");
    const link = document.createElement('a');
    link.href = base64
    link.setAttribute('download', 'wuo.png');

    console.log('download:',base64)

    document.body.appendChild(link);
    link.click();

    //let u = base64;
    //let t='img'
    //window.open('http://www.facebook.com/sharer.php?u='+encodeURIComponent(u)+'&t='+encodeURIComponent(t),'sharer','toolbar=0,status=0,width=626,height=436');
  }

  closeModal = () => {
    this.setState({ modalIsOpen: false })
  }

  openModal = () => {
    this.setState({ modalIsOpen: true })
  }

  componentDidMount() {
    Modal.setAppElement('body');
  }

  render() {
    const dragHandlers = {onStart: this.onStart, onStop: this.onStop};
    const { draggablePostion, modalIsOpen, sliderValue } = this.state

    return (
      <div className="cover-editor">
        <div className="upload">
          <label>
            <div className="upload-button">上傳照片</div>
            <input type="file" id="getval" onChange={this.onUpload}/>
          </label>
        </div>
        <div className="cover-box">
          <img
              className="cover-img"
              draggable="false"
              src={`${imgPath}object/1.png`}
              alt={'img'}/>
          <div className="drag-area">
            <Draggable
              bounds="parent"
              handle=".user-img"
              position={draggablePostion}
              {...dragHandlers} >
              <div className="user-img-wrapper">
                <img
                  id="user-img"
                  className="user-img"
                  draggable="false"
                  src={`${imgPath}wuo_sample.png`}
                  alt={'img'}
                  onLoad={this.onImgLoad}
                  /*onClick={this.openModal}*//>
              </div>
            </Draggable>
          </div>
        </div>
        <div className="slider">
          <Slider min={0} max={100} defaultValue={50} value={sliderValue} onChange={this.onResize}/>
          <div className="slider-minus">-</div>
          <div className="slider-plus">+</div>
        </div>
        <div className="actions">
          <div className="visit">
            <a
              target='_blank'
              rel='noopener noreferrer'
              href={'https://wuo-wuo.com/nest-holding-newspaper/each-period-of-nest-reported/800-wo-bao-bao-vol-14-quot-cat-is-hungry-quot-cat-diet-special-issue.html'} className="visit-button"></a>
          </div>
          <div className="download">
            <div className="download-button" onClick={this.download}></div>
          </div>
        </div>

        <Modal
          isOpen={modalIsOpen}
          onAfterOpen={null}
          onRequestClose={this.closeModal}
          style={modalStyles}
          contentLabel="Example Modal"
        >
          <div className="cover-box-modal">
            <img
                className="cover-img-modal"
                draggable="false"
                src={`${imgPath}object/2.png`}
                alt={'img'}/>
            <div className="drag-area-modal">
              <Draggable
                bounds="parent"
                handle=".user-img-modal"
                position={draggablePostion}
                {...dragHandlers} >
                <div className="user-img-wrapper-modal">
                  <img
                    id="user-img-modal"
                    className="user-img-modal"
                    draggable="false"
                    src={`${imgPath}wuo_sample.png`}
                    alt={'img'}
                    onLoad={this.onModalImgLoad}/>
                </div>
              </Draggable>
            </div>
          </div>
        </Modal>
      </div>
    );
  }
}

export default App;
