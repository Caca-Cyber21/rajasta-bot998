const { REST, Routes, SlashCommandBuilder } = require('discord.js');

// ⚠️ GANTI INI DENGAN CLIENT ID KAMU (yang dari Langkah 2)
const CLIENT_ID = process.env.CLIENT_ID;

// ⚠️ GANTI INI DENGAN TOKEN BOT KAMU (yang dari Langkah 1)
// Untuk lokal (di laptop), bisa langsung tulis tokennya di sini
const TOKEN = process.env.TOKEN;

const commands = [
    new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Mengecek apakah bot berjalan dan melihat latensi'),

    new SlashCommandBuilder()
        .setName('help')
        .setDescription('Menampilkan semua command dari bot'),

    new SlashCommandBuilder()
        .setName('kata-hari-ini')
        .setDescription('Membuat quote estetik dari teks yang kamu kirim')
        .addStringOption(option =>
            option.setName('teks')
                .setDescription('Teks quote yang ingin dibuat')
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('kasihrole')
        .setDescription('Memberikan role ke member (Khusus Admin)')
        .addStringOption(option =>
            option.setName('nama_role')
                .setDescription('Nama role yang akan diberikan')
                .setRequired(true)
        )
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Member yang akan diberikan role')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(0x8) // Hanya Admin (Permission: Administrator)
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        console.log('🔄 Mulai mendaftarkan slash commands...');

        // Daftarkan command secara GLOBAL (bisa dipakai di semua server)
        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: commands }
        );

        console.log('✅ Berhasil mendaftarkan slash commands!');
    } catch (error) {
        console.error('❌ Gagal mendaftarkan slash commands:', error);
    }
})();