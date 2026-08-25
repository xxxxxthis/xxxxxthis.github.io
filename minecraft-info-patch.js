(()=>{
  if (typeof PEPE_MC_INFO === "undefined") return;

  PEPE_MC_INFO.overview = {
    icon: "⛏️",
    kicker: "PEPE MINECRAFT · SERVER",
    title: "PEPE Minecraft",
    lead: "PEPE RESTAURANT 멤버를 위한 Java + Bedrock Crossplay 야생 서버입니다.",
    body: [
      "Discord 커뮤니티와 Minecraft 서버를 따로 운영하지 않고, PEPE MANAGER의 인증 시스템을 통해 하나의 멤버 시스템으로 연결합니다.",
      "기본 서버 상태와 Java + Bedrock 안내는 공개하지만, 접속자 정보·야생 기록·랭킹·실제 접속 주소는 Minecraft 인증을 완료한 멤버에게만 제공합니다.",
      "Discord 초대 요청 승인과 Minecraft 인증은 서로 다른 절차이며, 초대 승인만으로 Minecraft 멤버 전용 정보가 열리지는 않습니다."
    ],
    tags: ["Java", "Bedrock", "Crossplay", "야생", "Minecraft 인증"]
  };

  PEPE_MC_INFO.access = {
    icon: "🔐",
    kicker: "MINECRAFT MEMBER ACCESS",
    title: "승인제 운영",
    lead: "PEPE Minecraft는 Minecraft 인증을 완료한 멤버에게만 내부 정보와 접속 주소를 제공합니다.",
    body: [
      "Discord의 MINECRAFT 인증 채널에서 요청을 제출하면 운영진이 승인 또는 거절하며, 승인 시 ✅ MINECRAFT 인증 역할이 지급됩니다.",
      "Minecraft 전용 페이지에서 Discord 인증을 완료하면 접속 주소, 현재 생존자, 야생 누적 기록과 랭킹을 확인할 수 있습니다.",
      "Discord 초대 요청 승인은 Discord 서버 입장을 위한 별도 절차이며 Minecraft 인증 권한을 대신하지 않습니다. 서버 주소는 공개 파일에 저장하지 않고 PEPE MANAGER API가 권한을 확인한 뒤 전달합니다."
    ],
    tags: ["Minecraft 인증", "운영진 승인", "접근 제어", "비공개 주소"]
  };

  PEPE_MC_INFO.survival = {
    icon: "🌿",
    kicker: "PEPE SURVIVAL",
    title: "야생 서버",
    lead: "PEPE RESTAURANT 멤버들이 하나의 월드에서 자유롭게 생존하고 함께 기록을 쌓아가는 커뮤니티 중심의 야생 서버입니다.",
    body: [
      "플레이타임, 킬, 데스, 발전과제와 같은 생존 기록을 서버에서 수집해 멤버존에 반영합니다.",
      "누적 플레이어, 전체 플레이타임, 총 사망, 발전과제 등 함께 쌓인 야생 기록을 확인할 수 있습니다.",
      "플레이타임·킬·데스·발전과제·주간 활동 랭킹을 제공하며, 상세 기록과 플레이어 정보는 Minecraft 인증 멤버에게만 공개됩니다."
    ],
    tags: ["야생", "누적 기록", "랭킹", "멤버 전용"]
  };
})();