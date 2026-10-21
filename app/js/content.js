// Nội dung dùng chung cho bản web và bản iOS.
// Giữ file này giống hệt nhau ở site/app/js/ và ios/src/core/.

export const MOODS = [
  { v: 1, label: 'Rất nặng nề' },
  { v: 2, label: 'Nặng lòng' },
  { v: 3, label: 'Tạm ổn' },
  { v: 4, label: 'Nhẹ nhõm' },
  { v: 5, label: 'Rất ổn' },
];

export const EMOTIONS = ['Lo âu', 'Mệt mỏi', 'Buồn', 'Cô đơn', 'Tức giận', 'Áp lực', 'Bình yên', 'Biết ơn'];
export const TRIGGERS = ['Học tập', 'Gia đình', 'Bạn bè', 'Tình cảm', 'Giấc ngủ', 'Sức khỏe', 'Tiền bạc'];

export const HOTLINES = [
  { id: '111', number: '111', tel: '111', name: 'Tổng đài quốc gia bảo vệ trẻ em', hours: '24/7, miễn phí' },
  { id: 'ngaymai', number: '096 306 1414', tel: '0963061414', name: 'Đường dây nóng Ngày Mai', hours: '8:00–20:00 hằng ngày, miễn phí' },
  { id: '115', number: '115', tel: '115', name: 'Cấp cứu y tế', hours: 'Khi bạn đang gặp nguy hiểm ngay' },
];

// Thư viện bài tập. Sen chỉ chọn trong danh sách này, không tự tạo kỹ thuật mới.
export const SKILLS = [
  {
    id: 'box-breath', kind: 'breath', name: 'Thở hộp 4-4-4-4', minutes: 2, goodFor: 'Lo âu, căng thẳng',
    why: 'Nhịp thở đều giúp cơ thể ra khỏi trạng thái báo động.',
    steps: ['Hít vào bằng mũi, đếm 4', 'Giữ hơi, đếm 4', 'Thở ra bằng miệng, đếm 4', 'Giữ, đếm 4', 'Lặp lại 4 vòng'],
  },
  {
    id: 'grounding', kind: 'steps', name: 'Tiếp đất 5-4-3-2-1', minutes: 3, goodFor: 'Tức giận, hoảng',
    why: 'Kéo sự chú ý về hiện tại trước khi phản ứng.',
    steps: ['Kể tên 5 thứ bạn nhìn thấy', '4 thứ bạn chạm được', '3 âm thanh bạn nghe', '2 mùi bạn ngửi được', '1 điều bạn biết ơn lúc này'],
  },
  {
    id: 'self-kind', kind: 'steps', name: 'Viết cho mình như viết cho bạn thân', minutes: 5, goodFor: 'Buồn, cô đơn, tự trách',
    why: 'Ta thường nhẹ nhàng với bạn bè hơn với chính mình.',
    steps: ['Tưởng tượng bạn thân đang ở đúng hoàn cảnh của bạn', 'Bạn sẽ nói gì để bạn ấy thấy được hiểu?', 'Viết câu đó ra', 'Đọc lại, lần này cho chính mình'],
  },
  {
    id: 'reframe', kind: 'steps', name: 'Viết lại suy nghĩ', minutes: 5, goodFor: 'Lo âu, áp lực, suy nghĩ tiêu cực lặp lại',
    why: 'Suy nghĩ không phải sự thật. Nhìn bằng chứng giúp cân bằng lại.',
    steps: ['Viết ra suy nghĩ đang làm bạn khó chịu', 'Bằng chứng nào ủng hộ nó?', 'Bằng chứng nào cho thấy nó chưa chắc đúng?', 'Một cách nhìn cân bằng hơn là gì?'],
  },
  {
    id: 'three-good', kind: 'steps', name: 'Ba điều tốt hôm nay', minutes: 3, goodFor: 'Ngày ổn, muốn giữ cảm giác tốt',
    why: 'Ghi lại lúc ổn giúp bạn nhớ mình từng ổn khi ngày khó đến.',
    steps: ['Một điều nhỏ làm bạn cười', 'Một người đã giúp bạn', 'Một việc bạn tự hào'],
  },
  {
    id: 'wind-down', kind: 'steps', name: 'Thả lỏng trước khi ngủ', minutes: 10, goodFor: 'Khó ngủ, thức khuya',
    why: 'Thiếu ngủ làm mọi cảm xúc nặng hơn thường lệ.',
    steps: ['Đặt giờ đi ngủ cố định, ví dụ 23:00', 'Tắt màn hình trước giờ ngủ 30 phút', 'Để điện thoại ngoài tầm tay', 'Thả lỏng lần lượt vai, tay, chân'],
  },
  {
    id: 'chunk', kind: 'steps', name: 'Chia nhỏ việc 25/5', minutes: 30, goodFor: 'Áp lực học tập, trì hoãn',
    why: 'Một việc nhỏ làm được dễ bắt đầu hơn một núi việc.',
    steps: ['Chọn đúng một phần nhỏ, ví dụ 1 chương', 'Học 25 phút, tắt thông báo', 'Nghỉ 5 phút, đứng dậy uống nước', 'Xong một vòng là đủ cho tối nay'],
  },
  {
    id: 'one-message', kind: 'steps', name: 'Một tin nhắn', minutes: 2, goodFor: 'Cô đơn, thu mình',
    why: 'Cảm giác được kết nối là yếu tố bảo vệ sức khỏe tinh thần lâu dài.',
    steps: ['Nghĩ tới một người bạn tin', 'Viết một câu ngắn, ví dụ: “Tối nay rảnh nói chuyện 10 phút không?”', 'Tự bấm gửi khi bạn sẵn sàng'],
  },
];

// WHO-5 Well-Being Index (WHO, 1998). Bản dịch tiếng Việt của dự án, chưa phải bản chuẩn hóa chính thức.
export const WHO5 = {
  intro: 'Trong 2 tuần qua, mỗi câu dưới đây đúng với bạn tới mức nào?',
  items: [
    'Tôi cảm thấy vui vẻ và phấn chấn',
    'Tôi cảm thấy bình tĩnh và thư thái',
    'Tôi cảm thấy năng động, tràn đầy sức sống',
    'Tôi thức dậy thấy khỏe khoắn, được nghỉ ngơi đủ',
    'Cuộc sống hằng ngày có nhiều điều khiến tôi quan tâm',
  ],
  options: [
    { v: 5, label: 'Mọi lúc' },
    { v: 4, label: 'Hầu hết thời gian' },
    { v: 3, label: 'Hơn nửa thời gian' },
    { v: 2, label: 'Ít hơn nửa thời gian' },
    { v: 1, label: 'Thỉnh thoảng' },
    { v: 0, label: 'Không lúc nào' },
  ],
  threshold: 50,
  intervalDays: 14,
};

// Bốn giai đoạn của hành trình. Mỗi giai đoạn Sen lùi lại một bước.
export const STAGES = [
  { id: 'seed', name: 'Hạt', title: 'Gọi tên cảm xúc', fromDay: 0, sen: 'Nhắc nhẹ tối đa 1 lần/ngày, vào giờ bạn chọn.' },
  { id: 'leaf', name: 'Lá', title: 'Có công cụ trong tay', fromDay: 14, sen: 'Gợi ý bài tập đúng lúc. Có thể giảm nhắc còn 3 lần/tuần.' },
  { id: 'bud', name: 'Nụ', title: 'Tự nhận ra quy luật', fromDay: 60, sen: 'Hỏi bạn đã tự làm được gì trước khi gợi ý.' },
  { id: 'bloom', name: 'Hoa', title: 'Tốt nghiệp', fromDay: 180, sen: 'Đề xuất tắt nhắc nhở và giúp bạn lưu lại sổ kỹ năng.' },
];

// Cụm từ cho thấy nguy cơ tự hại. Ưu tiên báo nhầm hơn bỏ sót.
export const RISK_TERMS = [
  'tự tử', 'tự sát', 'muốn chết', 'không muốn sống', 'chẳng muốn sống', 'hết muốn sống', 'không thiết sống',
  'kết thúc cuộc đời', 'kết thúc tất cả', 'kết liễu', 'tự làm đau', 'tự làm hại', 'tự hại', 'rạch tay', 'cắt tay',
  'nhảy lầu', 'nhảy cầu', 'uống thuốc ngủ', 'biến mất mãi mãi', 'chết đi cho xong', 'không muốn tỉnh dậy',
  'sống không nổi', 'không đáng sống',
];

export const SESSION_NUDGE_MINUTES = 15;

// Dấu hiệu phụ thuộc: dùng từ 30 phút/ngày, ở ít nhất 3 ngày trong 7 ngày gần nhất.
export const HEAVY_USE = { minutesPerDay: 30, days: 3 };

// Dấu hiệu cô đơn kéo dài: chọn "Cô đơn" từ 3 lần trong 14 ngày.
export const LONELY = { windowDays: 14, times: 3 };

export const REMINDER_FREQ = [
  { v: 'daily', label: 'Mỗi ngày' },
  { v: 'thrice', label: '3 lần/tuần' },
];
export const RETENTION_CHOICES = [
  { v: 30, label: '30 ngày' },
  { v: 90, label: '90 ngày' },
  { v: 365, label: '1 năm' },
  { v: 0, label: 'Không tự xóa' },
];
