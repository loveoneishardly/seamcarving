let isDrawing = false;
var maskData = []; // Lưu trữ thông tin về mask đã vẽ   

// Set width and height to match the image
var newWidth  = 810;
var newHeight  = 383;

var master_ctx;
var ctx_enery;

// Draw the seam lowest enery map
const canvas_seam_lowest_enery = document.getElementById('image_seam_lowest_enery');
const ctx_seam_lowest_enery = canvas_seam_lowest_enery.getContext('2d');

const img = document.getElementById('original');
const master_canvas = document.getElementById('image_canvas_original');

const canvas = document.getElementById('image_canvas');
const ctx = canvas.getContext('2d');

const canvas_original = document.getElementById('image_canvas_original');
const ctx_original = canvas_original.getContext('2d');
canvas_original.width = newWidth;
canvas_original.height = newHeight;
ctx_original.drawImage(img, 0, 0, newWidth, newHeight);

//Draw mask image delete object
const canvas_mask = document.getElementById('image_seam_mask');
const ctx_mask = canvas_mask.getContext('2d');

// Khởi tạo đối tượng gif
var frames = [];

$(document).ready(function(){
  load_start_canvas(img, master_canvas, canvas, ctx, canvas_original, ctx_original, newWidth, newHeight, canvas_seam_lowest_enery, ctx_seam_lowest_enery);
  $("#btn_seam_removal").click(function(){   
    //console.log('Thực hiện seam carving dựa trên mask Coordinate:', maskData);
    var points = getAllDrawnPoints(ctx_original, maskData, 15);
    var w_mask = find_bound_mask(points, 'w');
    var h_mask = find_bound_mask(points, 'h');
    //console.log('Các điểm thuộc mask: ',points);
    //console.log('Width mask: ',w_mask);
    //console.log('Height mask: ',h_mask);
    var newMask = createMaskFromCoordinates(canvas.width, canvas.height, points);
    //const maxwidth = getMaxWidthOfMaskInPixels(newMask);
    //console.log('Thực hiện seam carving dựa trên new mask:', newMask);
    //console.log('Maxwidth trên new mask:', maxwidth);
    //resize image non mask
    //var energyMap = calculateEnergyMap(ctx, canvas.width, canvas.height);
    //drawEnergyMap(ctx_enery, energyMap, canvas.width, canvas.height);
    //var lowestEnerySeam = findLowestEnergySeam(energyMap, canvas.width, canvas.height);
    //drawSeam(ctx_seam_lowest_enery, lowestEnerySeam, canvas.width, canvas.height);
    //removeSeam(ctx, lowestEnerySeam, canvas.width, canvas.height, newMask);

    //resize image with mask: delete object choose
    for (let i = 0; i < w_mask + 50; i++){
      var energyMap = calculateEnergyMapwithMask(ctx, newMask, canvas.width, canvas.height);
      //console.log('Vẽ enery map with mask:', energyMap);
      //drawEnergyMap(ctx_enery, energyMap, canvas.width, canvas.height);
      var lowestEnerySeam = findLowestEnergySeam(energyMap, canvas.width, canvas.height);
      //drawSeam(ctx_seam_lowest_enery, lowestEnerySeam, canvas.width, canvas.height);
      removeSeam(ctx, lowestEnerySeam, canvas.width, canvas.height, newMask);
    }
    console.log(frames);

    changePixelsUsingMask(ctx_mask, canvas_mask, points, canvas.width, canvas.height, newWidth, newHeight);
    //result_check(points, ctx);
    // jQuery.ajax({
    //   url: './generateGIF',
    //   data: JSON.stringify({ frames: frames }),
    //   cache: false,
    //   contentType: false,
    //   processData: false,
    //   method: 'POST',
    //   type: 'POST', // For jQuery < 1.9
    //   success: function(data){
    //       console.log(data);
    //   }
    // });
    //var energyMap = calculateEnergyMapwithMask(ctx, newMask, canvas.width, canvas.height);
    // console.log('Vẽ enery map with mask:', energyMap);
    // drawEnergyMap(ctx_enery, energyMap, canvas.width, canvas.height);
    //var lowestEnerySeam = findLowestEnergySeam(energyMap, canvas.width, canvas.height);
    //drawSeam(ctx_seam_lowest_enery, lowestEnerySeam, canvas.width, canvas.height);
    //removeSeam(ctx, lowestEnerySeam, canvas.width, canvas.height, newMask);
    // while (!result_check(points, ctx)) {
    // }
    //var energyMap = calculateEnergyMap(ctx, canvas.width, canvas.height);
    //console.log(energyMap);
    //drawEnergyMap(ctx_enery, energyMap, canvas.width, canvas.height);
    //var lowestEnerySeam = findLowestEnergySeam(energyMap, canvas.width, canvas.height);
    //console.log(lowestEnerySeam);
    //drawSeam(ctx_seam_lowest_enery, lowestEnerySeam, canvas.width, canvas.height);
    //removeSeam(ctx, lowestEnerySeam, canvas.width, canvas.height);
  });

  $("#m_file_image").change(function(){
    $("#file_image").val("");
    var data = new FormData();
    jQuery.each(jQuery('#m_file_image')[0].files, function(i, file) {
      data.append("file_image", file);
    });

    jQuery.ajax({
      url: './uploadFile',
      data: data,
      cache: false,
      contentType: false,
      processData: false,
      method: 'POST',
      type: 'POST', // For jQuery < 1.9
      success: function(data){
          //console.log(data);
          if(data.result){
            $("#file_image").val(data.file);
            $('#original').attr('src', './upload/' + data.file);
            setTimeout(function () {
              load_start_canvas(img, master_canvas, canvas, ctx, canvas_original, ctx_original, newWidth, newHeight, canvas_seam_lowest_enery, ctx_seam_lowest_enery);
            }, 200);
          }
      }
    });
  });
});
// Hàm tính gradient của từng pixel
function calculateGradient(imageData, x, y, width, height) {
  var pixelIndex = (x + y * width) * 4; // Chỉ số của pixel
  var sumX = 0;
  var sumY = 0;

  // Tính gradient theo chiều ngang (X)
  if (x > 0 && x < width - 1) {
    var left = pixelIndex - 4;
    var right = pixelIndex + 4;
    for (var i = 0; i < 3; i++) { // R, G, B channels
      sumX += Math.pow(imageData[left + i] - imageData[right + i], 2); // Lấy bình phương độ chênh lệch màu sắc
    }
  }
  
  // Tính gradient theo chiều dọc (Y)
  if (y > 0 && y < height - 1) {
    var up = pixelIndex - width * 4;
    var down = pixelIndex + width * 4;
    for (var j = 0; j < 3; j++) { // R, G, B channels
      sumY += Math.pow(imageData[up + j] - imageData[down + j], 2); // Lấy bình phương độ chênh lệch màu sắc
    }
  }
  
  // Tổng gradient theo cả hai chiều
  return Math.sqrt(sumX + sumY);
}
  
// Hàm tính bản đồ năng lượng cho hình ảnh
function calculateEnergyMap(ctx, width, height) {
  var imageData = ctx.getImageData(0, 0, width, height).data;
  var energyMap = [];

  for (var y = 0; y < height; y++) {
    for (var x = 0; x < width; x++) {
      var energy = calculateGradient(imageData, x, y, width, height);
      energyMap.push(energy);
    }
  }

  return energyMap;
}

function drawEnergyMap(ctx, energyMap, width, height) {
  var maxEnergy = 1000; // Lấy giá trị năng lượng cao nhất

  ctx.clearRect(0, 0, width, height);

  for (var y = 0; y < height; y++) {
    for (var x = 0; x < width; x++) {
      var energy = energyMap[y * width + x];
      var colorValue = Math.floor((energy / maxEnergy) * 255);
      ctx.fillStyle = 'rgb(' + colorValue + ', ' + colorValue + ', ' + colorValue + ')';
      ctx.fillRect(x, y, 1, 1); // Vẽ từng pixel với màu sắc tương ứng với năng lượng
    }
  }
}

// Hàm tìm seam có năng lượng thấp nhất
function findLowestEnergySeam(energyMap, width, height) {
  // Tạo mảng lưu trữ năng lượng tích luỹ
  var cumulativeEnergyMap = [];
  for (var i = 0; i < width; i++) {
    cumulativeEnergyMap[i] = energyMap[i];
  }

  // Tính toán năng lượng tích luỹ cho từng pixel
  for (var y = 1; y < height; y++) {
    for (var x = 0; x < width; x++) {
      var minParent = cumulativeEnergyMap[(y - 1) * width + x];
      if (x > 0) {
        minParent = Math.min(minParent, cumulativeEnergyMap[(y - 1) * width + (x - 1)]);
      }
      if (x < width - 1) {
        minParent = Math.min(minParent, cumulativeEnergyMap[(y - 1) * width + (x + 1)]);
      }
      cumulativeEnergyMap[y * width + x] = energyMap[y * width + x] + minParent;
    }
  }

  // Tìm pixel có năng lượng tích luỹ nhỏ nhất ở hàng cuối cùng (seam có năng lượng thấp nhất)
  var minEnergy = Number.MAX_SAFE_INTEGER;
  var minIndex = -1;
  for (var i = 0; i < width; i++) {
    if (cumulativeEnergyMap[(height - 1) * width + i] < minEnergy) {
      minEnergy = cumulativeEnergyMap[(height - 1) * width + i];
      minIndex = i;
    }
  }

  // Tạo mảng seam chứa các chỉ số của pixel trên seam
  var seam = [];
  for (var y = height - 1; y >= 0; y--) {
    seam[y] = minIndex;
    var currentEnergy = cumulativeEnergyMap[y * width + minIndex];

    // Di chuyển sang pixel trên hàng trên cùng có năng lượng tích luỹ nhỏ nhất
    if (y > 0) {
      if (minIndex > 0 && cumulativeEnergyMap[(y - 1) * width + (minIndex - 1)] === currentEnergy - energyMap[y * width + minIndex]) {
        minIndex -= 1;
      } else if (minIndex < width - 1 && cumulativeEnergyMap[(y - 1) * width + (minIndex + 1)] === currentEnergy - energyMap[y * width + minIndex]) {
        minIndex += 1;
      }
    }
  }

  return seam;
}
  
// Hàm vẽ seam lên canvas
function drawSeam(ctx, seam, width, height) {
  ctx.beginPath();
  ctx.strokeStyle = 'red';
  
  for (var y = 0; y < height; y++) {
    ctx.lineTo(seam[y], y);
  }

  ctx.stroke();
}

// Hàm loại bỏ seam khỏi hình ảnh
function removeSeam(ctx, seam, canvasWidth, canvasHeight, newMask) {
  var imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
  var pixels = imageData.data;

  // Xóa seam khỏi ảnh
  for (var y = 0; y < canvasHeight; y++) {
    var seamX = seam[y];
    for (var x = seamX; x < canvasWidth - 1; x++) {
      var destIndex = (y * canvasWidth + x) * 4;
      var srcIndex = (y * canvasWidth + x + 1) * 4;
      pixels[destIndex] = pixels[srcIndex]; // Red channel
      pixels[destIndex + 1] = pixels[srcIndex + 1]; // Green channel
      pixels[destIndex + 2] = pixels[srcIndex + 2]; // Blue channel
      pixels[destIndex + 3] = pixels[srcIndex + 3]; // Alpha channel
    }
  }
  
  // Cập nhật kích thước canvas
  canvasWidth -= 1;
  ctx.canvas.width = canvasWidth;
  
  // Cập nhật ảnh mới sau khi xóa seam
  ctx.putImageData(imageData, 0, 0);

  // Thêm frame mới cho gif từ canvas
  frames.push(new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height));
}

// Helper function that returns the color of the pixel.
// const getPixel = (imgData, x, y) => {
//   const i = (y * imgData.width + x) * 4;
//   return [
//     imgData.data[i],     // Red
//     imgData.data[i + 1], // Green
//     imgData.data[i + 2], // Blue
//     imgData.data[i + 3], // Alpha
//   ];
// };

// Helper function that sets the color of the pixel.
const setPixel = (imgData, x, y, color) => {
  const i = (y * imgData.width + x) * 4;
  imgData.data[i] = color[0];     // Red
  imgData.data[i + 1] = color[1]; // Green
  imgData.data[i + 2] = color[2]; // Blue
  imgData.data[i + 3] = color[3]; // Alpha
};

function changePixelsUsingMask(ctx, canvas_mask, mask, canvasWidth, canvasHeight, Width, Height) {
  canvas_mask.width = newWidth;
  canvas_mask.height = newHeight;
  ctx.lineWidth = 1;
  ctx.fillStyle = 'rgba(0, 0, 0, 0)';
  ctx.strokeRect(0, 0, newWidth, newHeight);

  // canvas_mask.width = Width;
  // canvas_mask.height = Height;
  // ctx.lineWidth = 5;
  // ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
  // Lặp qua từng điểm ảnh trong mask
  mask.forEach(point => {
    const { x, y } = point;

    // Kiểm tra xem điểm ảnh có nằm trong giới hạn của ảnh không
    if (x >= 0 && x < canvasWidth && y >= 0 && y < canvasHeight) {
      // Thay đổi điểm ảnh tại vị trí (x, y)
      const imageData = ctx.getImageData(x, y, 1, 1);
      const data = imageData.data;

      // Thay đổi màu sắc của điểm ảnh của mask
      data[0] = 0; // R
      data[1] = 0;   // G
      data[2] = 0;   // B
      data[3] = 255; // Alpha

      // Cập nhật điểm ảnh với màu mới
      ctx.putImageData(imageData, x, y);
    }
  });
}



// Hàm lấy màu tại điểm pixel trên canvas
function getPixelColor(ctx, x, y) {
  var pixelData = ctx.getImageData(x, y, 1, 1).data;
  return {
    r: pixelData[0],
    g: pixelData[1],
    b: pixelData[2],
    a: pixelData[3] / 255
  };
}

// Hàm lấy tất cả các điểm được vẽ trên theo lineWidth
function getAllDrawnPoints(ctx, maskData, lineWidth) {
  var drawnPoints = [];

  for (var i = 0; i < maskData.length - 1; i++) {
    var startPoint = maskData[i];
    var endPoint = maskData[i + 1];

    var dx = endPoint.x - startPoint.x;
    var dy = endPoint.y - startPoint.y;
    var distance = Math.sqrt(dx * dx + dy * dy);

    var step = 1 / distance;

    for (var t = 0; t < 1; t += step) {
      var currentX = startPoint.x + t * dx;
      var currentY = startPoint.y + t * dy;

      for (var w = -lineWidth / 2; w < lineWidth / 2; w++) {
        for (var h = -lineWidth / 2; h < lineWidth / 2; h++) {
          var x = Math.floor(currentX + w);
          var y = Math.floor(currentY + h);
          var color = getPixelColor(master_ctx, x, y);
          drawnPoints.push({ x, y, color });
        }
      }
    }
  }

  return drawnPoints;
}














function calculateEnergyMapwithMask(ctx, mask, width, height) {
  var imageData = ctx.getImageData(0, 0, width, height).data;
  var energyMap = [];

  for (var y = 0; y < height; y++) {
    for (var x = 0; x < width; x++) {
      var maskValue = mask[y] !== undefined ? mask[y][x] : undefined;

      if (maskValue !== undefined && maskValue < 0) {
        energyMap.push(-999); // Đặt giá trị âm vô cùng lớn cho pixel thuộc mask
      } else {
          var energy = calculateGradient(imageData, x, y, width, height);
        energyMap.push(energy);
      }
    }
  }
  return energyMap;
}


function createMaskFromCoordinates(width, height, coordinates) {
  var newMask = [];
  // Khởi tạo mask với giá trị mặc định
  for (var y = 0; y < height; y++) {
    newMask[y] = [];
    for (var x = 0; x < width; x++) {
      newMask[y][x] = 1; // Giá trị mặc định cho các pixel không thuộc mask là 1
    }
  }

  // Đặt giá trị của các pixel từ tọa độ trong mask
  for (var i = 0; i < coordinates.length; i++) {
    var coord = coordinates[i];
    var xCoord = Math.floor(coord.x);
    var yCoord = Math.floor(coord.y);

    // Đặt giá trị âm vô cùng lớn cho các pixel thuộc mask
    if (xCoord >= 0 && xCoord < width && yCoord >= 0 && yCoord < height) {
      newMask[yCoord][xCoord] = -999;
    }
  }
  return newMask;
}



// Hàm kiểm tra xem điểm trên mask có trùng khớp với điểm trên canvas không
function checkPointOnCanvas(point, ctx) {
  const pixel = ctx.getImageData(point.x, point.y, 1, 1);
  const data = pixel.data;
  const color = {
    r: data[0],
    g: data[1],
    b: data[2],
    a: data[3] / 255 // Alpha value normalized between 0 and 1
  };

  // Kiểm tra xem màu sắc của điểm trên mask có giống với điểm trên canvas không
  if (color.r === point.color.r && color.g === point.color.g &&  color.b === point.color.b && color.a === point.color.a) {
    return true; // giống nhau, còn object
  } else {
    return false;
  }
}

function result_check(point_mask, ctx) {
  console.log("Bắt đầu kiểm tra...");
  let check = true; // Đặt biến check ban đầu là true

  for (let i = 0; i < point_mask.length; i++) {
    if (checkPointOnCanvas(point_mask[i], ctx)) {
      console.log("Có đối tượng >>>");
      check = false; // Nếu tìm thấy điểm trùng khớp, đặt biến check thành false
      break; // Dừng vòng lặp khi tìm thấy điểm trùng khớp
    }
    console.log("Chạy tiếp >>>");
  }

  console.log("Kiểm tra xong!");
  return check; // Trả về giá trị của biến check sau khi kiểm tra xong
}

function load_start_canvas(img, master_canvas, canvas, ctx, canvas_original, ctx_original, newWidth, newHeight, canvas_seam_lowest_enery, ctx_seam_lowest_enery){
  master_ctx = master_canvas.getContext('2d');
  // Draw the image original
  ctx_original.drawImage(img, 0, 0, newWidth, newHeight);

  // Draw the enery map
  const canvas_enery = document.getElementById('image_enerymap');
  ctx_enery = canvas_enery.getContext('2d');
  canvas_enery.width = newWidth;
  canvas_enery.height = newHeight;

  // Draw the seam lowest enery map
  canvas_seam_lowest_enery.width = newWidth;
  canvas_seam_lowest_enery.height = newHeight;

  // Draw the image origonal in seam lowest enery map
  ctx_seam_lowest_enery.drawImage(img, 0, 0, newWidth, newHeight);

  // Draw the image on the canvas seamcarving
  canvas.width = newWidth;
  canvas.height = newHeight;
  ctx.drawImage(img, 0, 0, newWidth, newHeight);

  // Event listener for when the mouse button is pressed down
  canvas_original.addEventListener('mousedown', (e) => {
    isDrawing = true;
    ctx_original.beginPath();
    ctx_original.moveTo(e.clientX - canvas_original.getBoundingClientRect().left, e.clientY - canvas_original.getBoundingClientRect().top);
  });

  // Event listener for when the mouse is moved while holding the button down
  canvas_original.addEventListener('mousemove', (e) => {
    if (isDrawing) {
      ctx_original.lineTo(e.clientX - canvas_original.getBoundingClientRect().left, e.clientY - canvas_original.getBoundingClientRect().top);
      ctx_original.lineWidth = 15; // Độ dày của nét vẽ
      ctx_original.lineCap = 'round'; // Loại đầu nét vẽ
      ctx_original.strokeStyle = 'red'; // Màu sắc nét vẽ
      ctx_original.stroke();

      // Lưu thông tin về mask đã vẽ
      maskData.push({ x: e.clientX - canvas_original.getBoundingClientRect().left, y: e.clientY - canvas_original.getBoundingClientRect().top });
    }
  });

  // Dừng vẽ khi chuột được nhả ra hoặc di chuyển ra khỏi canvas
  canvas_original.addEventListener('mouseup', function() {
    isDrawing = false;
  });

  canvas_original.addEventListener('mouseout', function() {
    isDrawing = false;
  });
}

function find_bound_mask(point_mask, type){
  // Tìm giá trị lớn nhất của x và y
  let maxX = -Infinity;
  let maxY = -Infinity;
  let minX = Infinity;
  let minY = Infinity;

  point_mask.forEach(point => {
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
  });

  // Tính chiều rộng và chiều cao
  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  if (type == 'w') {
    return width;
  } else {
    return height;
  }
}


function getMaxWidthOfMaskInPixels(mask) {
  let maxWidth = 0;

  // Duyệt qua từng hàng của mask để tìm chiều rộng lớn nhất
  for (let y = 0; y < mask.length; y++) {
      const row = mask[y];
      let startPixel = -1;
      
      for (let x = 0; x < row.length; x++) {
          // Nếu gặp giá trị -999, bắt đầu tính toán độ rộng
          if (row[x] === -999) {
              if (startPixel === -1) {
                  startPixel = x; // Lưu vị trí bắt đầu
              } else {
                  const width = x - startPixel + 1; // Tính độ rộng tính từ vị trí bắt đầu
                  maxWidth = Math.max(maxWidth, width);
              }
          } else {
              startPixel = -1; // Reset vị trí bắt đầu nếu không phải giá trị -999
          }
      }
  }

  return maxWidth;
}