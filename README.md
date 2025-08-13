sudo apt update
sudo apt install graphicsmagick

let multiple_page_append = (pdfPath: string, page: number) => {
    let image = [...Array(page).keys()]?.map(r => `${pdfPath}[${r}]`)?.join(" ");
    return `gm convert -density 300 ${image} -append png:-`
}

lsof -i :8080
lsof -i :8082
kill -9 <PID>

gm convert -density 300 "/tmp/1748779587627-investment.pdf[0]" -resize 1300x720 -crop 650x360+0+0 webp:- >/media/srakib17/Development/Web/papernxt.com/server-papernext.com/uploads/documents/thumbnails/1748779587627-investment.webp

cat /usr/lib/tmpfiles.d/tmp.conf

sudo apt install default-jre

sudo apt install poppler-utils
pdfinfo

pdftotext

pdftohtml

pdftoppm

pdftops

pdfimages

pdfdetach

pdfunite

pdfseparate

pdftocairo

pdffonts

pdfsig
# xporto-server
