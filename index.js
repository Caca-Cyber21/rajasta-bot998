// ==========================================
// IMPORT LIBRARIES
// ==========================================
const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField, Events } = require('discord.js');
const express = require('express');

// ==========================================
// KONFIGURASI AWAL
// ==========================================
const app = express();
const PORT = process.env.PORT || 3000;
const TOKEN = process.env.TOKEN;

// Validasi Token
if (!TOKEN) {
    console.error('❌ [ERROR] Token bot tidak ditemukan! Pastikan kamu sudah mengatur environment variable TOKEN di Render.');
    process.exit(1);
}

// Inisialisasi Discord Client dengan Intents yang dibutuhkan
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers, // Diperlukan untuk fitur kasih role
    ],
});

// ==========================================
// WEB SERVER EXPRESS (KEEP-ALIVE)
// ==========================================
app.get('/', (req, res) => {
    res.send('RAJASTA Bot is alive!');
});

app.listen(PORT, () => {
    console.log(`🌐 [WEB] Server Express berjalan di port ${PORT}`);
});

// ==========================================
// EVENT: BOT READY
// ==========================================
client.once(Events.ClientReady, (c) => {
    console.log(`✅ [BOT] RAJASTA Bot berhasil login sebagai ${c.user.tag}`);
    console.log(`📋 [BOT] Siap melayani di ${c.guilds.cache.size} server.`);
});

// ==========================================
// EVENT: INTERAKSI SLASH COMMAND
// ==========================================
client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, options, member } = interaction;

    try {
        // ------------------------------------------
        // FITUR 1: PING
        // ------------------------------------------
        if (commandName === 'ping') {
            const latency = Date.now() - interaction.createdTimestamp;
            await interaction.reply(`🏓 **Pong!**\nLatensi: \`${latency}ms\`\nAPI Latensi: \`${Math.round(client.ws.ping)}ms\``);
        }

        // ------------------------------------------
        // FITUR 2: HELP
        // ------------------------------------------
        else if (commandName === 'help') {
            const helpEmbed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('📚 Daftar Command RAJASTA Bot')
                .setDescription('Berikut adalah command yang tersedia:')
                .addFields(
                    { name: '/ping', value: 'Mengecek apakah bot berjalan dan melihat latensi.' },
                    { name: '/help', value: 'Menampilkan pesan bantuan ini.' },
                    { name: '/kata-hari-ini <teks>', value: 'Membuat quote estetik dari teks yang kamu kirim.' },
                    { name: '/kasihrole <nama_role> <user>', value: 'Memberikan role ke member (Khusus Admin).' }
                )
                .setFooter({ text: 'RAJASTA Bot v1.0' })
                .setTimestamp();

            await interaction.reply({ embeds: [helpEmbed] });
        }

        // ------------------------------------------
        // FITUR 3: KATA-HARI-INI (QUOTE GENERATOR)
        // ------------------------------------------
        else if (commandName === 'kata-hari-ini') {
            const teks = options.getString('teks');
            const user = interaction.user;

            // Membuat Embed yang menyerupai gambar di contoh
            const quoteEmbed = new EmbedBuilder()
                .setColor(0x2b2d31) // Warna gelap
                .setAuthor({ 
                    name: `Kata-kata hari ini dari @${user.username}`, 
                    iconURL: user.displayAvatarURL({ dynamic: true }) 
                })
                .setDescription(`> *"${teks}"*\n\n- ${user.username}`)
                .setImage('https://i.imgur.com/8Y2yX4B.jpeg') // Ganti URL ini dengan gambar background estetik pilihanmu
                .setFooter({ text: 'Rajasta Quotes' })
                .setTimestamp();

            // Mengirim pesan
            await interaction.reply({ content: `Halo <@${user.id}>! Ini quote kamu:`, embeds: [quoteEmbed] });
        }

        // ------------------------------------------
        // FITUR 4: KASIH ROLE
        // ------------------------------------------
        else if (commandName === 'kasihrole') {
            // Cek apakah user yang memakai command adalah Admin
            if (!member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return interaction.reply({ content: '❌ Maaf, kamu tidak memiliki izin **Administrator** untuk menggunakan command ini.', ephemeral: true });
            }

            const roleName = options.getString('nama_role');
            const targetUser = options.getUser('user');

            // Mencari role berdasarkan nama
            const role = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase());
            
            if (!role) {
                return interaction.reply({ content: `❌ Role dengan nama **${roleName}** tidak ditemukan. Pastikan nama role benar.`, ephemeral: true });
            }

            // Mencari member berdasarkan user yang di-tag
            const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

            if (!targetMember) {
                return interaction.reply({ content: `❌ Member **${targetUser.tag}** tidak ditemukan di server ini.`, ephemeral: true });
            }

            // Cek apakah bot memiliki role yang lebih tinggi dari role yang akan diberikan
            const botMember = interaction.guild.members.me;
            if (botMember.roles.highest.position <= role.position) {
                return interaction.reply({ content: `❌ Bot tidak bisa memberikan role **${role.name}** karena posisi role tersebut lebih tinggi atau sama dengan role tertinggi bot.`, ephemeral: true });
            }

            // Proses memberikan role
            try {
                await targetMember.roles.add(role);
                await interaction.reply({ content: `✅ Berhasil memberikan role **${role.name}** kepada **${targetUser.tag}**.` });
            } catch (error) {
                console.error('[ERROR] Gagal memberikan role:', error);
                await interaction.reply({ content: `❌ Terjadi kesalahan saat memberikan role. Pastikan bot memiliki izin **Manage Roles**.`, ephemeral: true });
            }
        }

    } catch (error) {
        console.error(`[ERROR] Terjadi kesalahan saat mengeksekusi command ${commandName}:`, error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: '❌ Terjadi kesalahan internal saat memproses command ini.', ephemeral: true });
        }
    }
});

// ==========================================
// EVENT: ERROR HANDLING
// ==========================================
client.on(Events.Error, (error) => {
    console.error('❌ [DISCORD ERROR]', error);
});

process.on('unhandledRejection', (error) => {
    console.error('❌ [UNHANDLED REJECTION]', error);
});

process.on('uncaughtException', (error) => {
    console.error('❌ [UNCAUGHT EXCEPTION]', error);
});

// ==========================================
// LOGIN BOT
// ==========================================
client.login(TOKEN).catch((error) => {
    console.error('❌ [LOGIN ERROR] Gagal login ke Discord. Periksa Token kamu.', error);
});